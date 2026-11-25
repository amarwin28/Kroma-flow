import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { leadSchema } from "@/lib/validation";
import { runWorkflowsForTrigger } from "@/lib/automation";

export async function GET(req: Request) {
  const auth = await requireAuth("crm:read");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const q = searchParams.get("q") || "";

  const db = getDb();
  let sql = `SELECT l.*, u.name as owner_name FROM leads l LEFT JOIN users u ON u.id = l.owner_id WHERE l.org_id = ?`;
  const params: unknown[] = [auth.user.orgId];

  if (status) {
    sql += " AND l.status = ?";
    params.push(status);
  }
  if (priority) {
    sql += " AND l.priority = ?";
    params.push(priority);
  }
  if (q) {
    sql += " AND (l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)";
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  sql += " ORDER BY l.created_at DESC";
  const leads = db.prepare(sql).all(...(params as string[]));
  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const auth = await requireAuth("crm:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid lead data" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const id = `lead_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(
    `INSERT INTO leads (id, org_id, name, email, phone, company, source, status, priority, owner_id, follow_up_date, estimated_value, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    auth.user.orgId,
    d.name,
    d.email,
    d.phone,
    d.company,
    d.source,
    d.status,
    d.priority,
    d.ownerId || auth.user.id,
    d.followUpDate,
    d.estimatedValue,
    d.notes,
    now,
    now
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "lead.created",
    entityType: "lead",
    entityId: id,
    details: { name: d.name, company: d.company },
  });

  runWorkflowsForTrigger(auth.user.orgId, "lead.created", {
    leadId: id,
    name: d.name,
    priority: d.priority,
    estimatedValue: d.estimatedValue,
  });

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  return NextResponse.json({ lead }, { status: 201 });
}
