import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";

const convertSchema = z.object({
  target: z.enum(["project", "invoice"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("quotes:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = convertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Specify target: project or invoice" }, { status: 400 });
  }

  const db = getDb();
  const qt = db
    .prepare("SELECT * FROM quotations WHERE id = ? AND org_id = ?")
    .get(id, auth.user.orgId) as
    | {
        id: string;
        title: string;
        client_name: string;
        client_email: string;
        client_company: string;
        items_json: string;
        subtotal: number;
        discount_percent: number;
        tax_percent: number;
        total: number;
        notes: string;
      }
    | undefined;

  if (!qt) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  if (parsed.data.target === "project") {
    const projectId = `proj_${crypto.randomUUID()}`;
    db.prepare(
      `INSERT INTO projects (id, org_id, quotation_id, name, description, client_name, client_email, status, progress, start_date, manager_id, budget, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Planning', 0, ?, ?, ?, ?, ?)`
    ).run(
      projectId,
      auth.user.orgId,
      qt.id,
      qt.title,
      `Converted from quotation ${qt.id}`,
      qt.client_name,
      qt.client_email,
      now.slice(0, 10),
      auth.user.id,
      qt.total,
      now,
      now
    );

    logAudit({
      orgId: auth.user.orgId,
      userId: auth.user.id,
      action: "quotation.converted_to_project",
      entityType: "project",
      entityId: projectId,
    });

    return NextResponse.json({ projectId }, { status: 201 });
  }

  const invoiceId = `inv_${crypto.randomUUID()}`;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;
  const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  db.prepare(
    `INSERT INTO invoices (id, org_id, quotation_id, invoice_number, client_name, client_email, client_company, items_json, subtotal, discount_percent, tax_percent, total, amount_paid, status, due_date, issued_at, notes, share_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Unpaid', ?, ?, ?, ?, ?, ?)`
  ).run(
    invoiceId,
    auth.user.orgId,
    qt.id,
    invoiceNumber,
    qt.client_name,
    qt.client_email,
    qt.client_company,
    qt.items_json,
    qt.subtotal,
    qt.discount_percent,
    qt.tax_percent,
    qt.total,
    dueDate,
    now.slice(0, 10),
    qt.notes,
    `share_inv_${crypto.randomBytes(8).toString("hex")}`,
    now,
    now
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "quotation.converted_to_invoice",
    entityType: "invoice",
    entityId: invoiceId,
  });

  return NextResponse.json({ invoiceId, invoiceNumber }, { status: 201 });
}
