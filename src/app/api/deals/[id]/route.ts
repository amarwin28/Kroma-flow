import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { dealSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("deals:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = dealSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deal update" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM deals WHERE id = ? AND org_id = ?")
    .get(id, auth.user.orgId);
  if (!existing) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const d = parsed.data;
  db.prepare(
    `UPDATE deals SET
      title = COALESCE(?, title),
      company = COALESCE(?, company),
      contact_name = COALESCE(?, contact_name),
      contact_email = COALESCE(?, contact_email),
      value = COALESCE(?, value),
      stage = COALESCE(?, stage),
      probability = COALESCE(?, probability),
      expected_close_date = COALESCE(?, expected_close_date),
      owner_id = COALESCE(?, owner_id),
      notes = COALESCE(?, notes),
      updated_at = ?
     WHERE id = ? AND org_id = ?`
  ).run(
    d.title ?? null,
    d.company ?? null,
    d.contactName ?? null,
    d.contactEmail ?? null,
    d.value ?? null,
    d.stage ?? null,
    d.probability ?? null,
    d.expectedCloseDate ?? null,
    d.ownerId ?? null,
    d.notes ?? null,
    new Date().toISOString(),
    id,
    auth.user.orgId
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: d.stage ? `deal.stage.${d.stage.toLowerCase()}` : "deal.updated",
    entityType: "deal",
    entityId: id,
  });

  const deal = db.prepare("SELECT * FROM deals WHERE id = ?").get(id);
  return NextResponse.json({ deal });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("deals:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = getDb();
  const res = db
    .prepare("DELETE FROM deals WHERE id = ? AND org_id = ?")
    .run(id, auth.user.orgId);
  if (res.changes === 0) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
