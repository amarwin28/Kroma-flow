import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { dealSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAuth("deals:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const deals = db
    .prepare(
      `SELECT d.*, u.name as owner_name
       FROM deals d LEFT JOIN users u ON u.id = d.owner_id
       WHERE d.org_id = ? ORDER BY d.updated_at DESC`
    )
    .all(auth.user.orgId);

  return NextResponse.json({ deals });
}

export async function POST(req: Request) {
  const auth = await requireAuth("deals:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid deal data" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const id = `deal_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(
    `INSERT INTO deals (id, org_id, title, company, contact_name, contact_email, value, stage, probability, expected_close_date, owner_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    auth.user.orgId,
    d.title,
    d.company,
    d.contactName,
    d.contactEmail,
    d.value,
    d.stage,
    d.probability,
    d.expectedCloseDate,
    d.ownerId || auth.user.id,
    d.notes,
    now,
    now
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "deal.created",
    entityType: "deal",
    entityId: id,
    details: { title: d.title, value: d.value },
  });

  const deal = db.prepare("SELECT * FROM deals WHERE id = ?").get(id);
  return NextResponse.json({ deal }, { status: 201 });
}
