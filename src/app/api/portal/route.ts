import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { runWorkflowsForTrigger } from "@/lib/automation";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const db = getDb();
  const orgId = auth.user.orgId;
  const isClient = auth.user.role === "client";

  // Strict client data isolation: clients ONLY see records matching their email
  const clientFilter = isClient ? " AND LOWER(client_email) = LOWER(?)" : "";
  const params = isClient ? [orgId, auth.user.email] : [orgId];

  const quotations = db
    .prepare(
      `SELECT id, quote_number, title, client_name, client_email, total, status, valid_until, items_json
       FROM quotations WHERE org_id = ?${clientFilter} ORDER BY created_at DESC`
    )
    .all(...params);

  const projects = db
    .prepare(
      `SELECT id, name, description, client_name, client_email, status, progress, start_date, end_date
       FROM projects WHERE org_id = ?${clientFilter} ORDER BY created_at DESC`
    )
    .all(...params);

  const invoices = db
    .prepare(
      `SELECT id, invoice_number, client_name, client_email, total, amount_paid, status, due_date
       FROM invoices WHERE org_id = ?${clientFilter} ORDER BY created_at DESC`
    )
    .all(...params);

  const sharedDocuments = db
    .prepare(
      `SELECT id, folder, name, mime_type, size_bytes, content_text, created_at
       FROM documents WHERE org_id = ? AND shared_with_client = 1 ORDER BY created_at DESC`
    )
    .all(orgId);

  const feedback = db
    .prepare(
      isClient
        ? "SELECT * FROM client_feedback WHERE org_id = ? AND LOWER(client_email) = LOWER(?) ORDER BY created_at DESC"
        : "SELECT * FROM client_feedback WHERE org_id = ? ORDER BY created_at DESC"
    )
    .all(...params);

  return NextResponse.json({
    isClient,
    quotations,
    projects,
    invoices,
    sharedDocuments,
    feedback,
  });
}

const portalActionSchema = z.object({
  action: z.enum(["approve_quote", "reject_quote", "submit_feedback"]),
  quotationId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = portalActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid portal action" }, { status: 400 });
  }

  const db = getDb();
  const d = parsed.data;

  if ((d.action === "approve_quote" || d.action === "reject_quote") && d.quotationId) {
    const qt = db
      .prepare("SELECT id, client_email FROM quotations WHERE id = ? AND org_id = ?")
      .get(d.quotationId, auth.user.orgId) as { id: string; client_email: string } | undefined;

    if (!qt) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }
    if (
      auth.user.role === "client" &&
      qt.client_email.toLowerCase() !== auth.user.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextStatus = d.action === "approve_quote" ? "Approved" : "Rejected";
    db.prepare("UPDATE quotations SET status = ?, updated_at = ? WHERE id = ?").run(
      nextStatus,
      new Date().toISOString(),
      qt.id
    );

    logAudit({
      orgId: auth.user.orgId,
      userId: auth.user.id,
      action: `portal.quotation.${nextStatus.toLowerCase()}`,
      entityType: "quotation",
      entityId: qt.id,
    });

    if (nextStatus === "Approved") {
      runWorkflowsForTrigger(auth.user.orgId, "quotation.approved", { quotationId: qt.id });
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  }

  if (d.action === "submit_feedback" && d.comment) {
    db.prepare(
      `INSERT INTO client_feedback (id, org_id, client_email, entity_type, entity_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `fb_${crypto.randomUUID()}`,
      auth.user.orgId,
      auth.user.email,
      d.entityType || "project",
      d.entityId || "general",
      d.rating || 5,
      d.comment,
      new Date().toISOString()
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
