import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { leadSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("crm:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = leadSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead update" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM leads WHERE id = ? AND org_id = ?")
    .get(id, auth.user.orgId);
  if (!existing) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const d = parsed.data;
  db.prepare(
    `UPDATE leads SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      company = COALESCE(?, company),
      source = COALESCE(?, source),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      owner_id = COALESCE(?, owner_id),
      follow_up_date = COALESCE(?, follow_up_date),
      estimated_value = COALESCE(?, estimated_value),
      notes = COALESCE(?, notes),
      updated_at = ?
     WHERE id = ? AND org_id = ?`
  ).run(
    d.name ?? null,
    d.email ?? null,
    d.phone ?? null,
    d.company ?? null,
    d.source ?? null,
    d.status ?? null,
    d.priority ?? null,
    d.ownerId ?? null,
    d.followUpDate ?? null,
    d.estimatedValue ?? null,
    d.notes ?? null,
    new Date().toISOString(),
    id,
    auth.user.orgId
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "lead.updated",
    entityType: "lead",
    entityId: id,
  });

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  return NextResponse.json({ lead });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("crm:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = getDb();
  const res = db
    .prepare("DELETE FROM leads WHERE id = ? AND org_id = ?")
    .run(id, auth.user.orgId);
  if (res.changes === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "lead.deleted",
    entityType: "lead",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
