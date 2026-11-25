import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("deals:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = getDb();
  const lead = db
    .prepare("SELECT * FROM leads WHERE id = ? AND org_id = ?")
    .get(id, auth.user.orgId) as
    | {
        id: string;
        name: string;
        email: string;
        company: string;
        estimated_value: number;
        owner_id: string | null;
        notes: string;
      }
    | undefined;

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const dealId = `deal_${crypto.randomUUID()}`;
  const closeDate = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10);

  db.prepare(
    `INSERT INTO deals (id, org_id, lead_id, title, company, contact_name, contact_email, value, stage, probability, expected_close_date, owner_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Qualified', 50, ?, ?, ?, ?, ?)`
  ).run(
    dealId,
    auth.user.orgId,
    lead.id,
    `${lead.company || lead.name} — Opportunity`,
    lead.company,
    lead.name,
    lead.email,
    lead.estimated_value || 0,
    closeDate,
    lead.owner_id || auth.user.id,
    lead.notes,
    now,
    now
  );

  db.prepare("UPDATE leads SET status = 'Converted', updated_at = ? WHERE id = ?").run(now, lead.id);

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "lead.converted",
    entityType: "deal",
    entityId: dealId,
    details: { leadId: lead.id },
  });

  const deal = db.prepare("SELECT * FROM deals WHERE id = ?").get(dealId);
  return NextResponse.json({ deal }, { status: 201 });
}
