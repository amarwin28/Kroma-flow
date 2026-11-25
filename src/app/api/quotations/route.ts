import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { computeTotals, quotationSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAuth("quotes:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const quotations = db
    .prepare("SELECT * FROM quotations WHERE org_id = ? ORDER BY created_at DESC")
    .all(auth.user.orgId);

  return NextResponse.json({ quotations });
}

export async function POST(req: Request) {
  const auth = await requireAuth("quotes:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = quotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid quotation data" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const { subtotal, total } = computeTotals(d.items, d.discountPercent, d.taxPercent);
  const id = `qt_${crypto.randomUUID()}`;
  const quoteNumber = `QT-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;
  const shareToken = `share_qt_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO quotations (id, org_id, deal_id, quote_number, title, client_name, client_email, client_company, items_json, subtotal, discount_percent, tax_percent, total, status, valid_until, notes, share_token, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    auth.user.orgId,
    d.dealId || null,
    quoteNumber,
    d.title,
    d.clientName,
    d.clientEmail,
    d.clientCompany,
    JSON.stringify(d.items),
    subtotal,
    d.discountPercent,
    d.taxPercent,
    total,
    d.validUntil,
    d.notes,
    shareToken,
    auth.user.id,
    now,
    now
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "quotation.created",
    entityType: "quotation",
    entityId: id,
    details: { quoteNumber, total },
  });

  const quotation = db.prepare("SELECT * FROM quotations WHERE id = ?").get(id);
  return NextResponse.json({ quotation }, { status: 201 });
}
