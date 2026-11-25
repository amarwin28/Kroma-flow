import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { computeTotals, invoiceSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAuth("invoices:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const invoices = db
    .prepare("SELECT * FROM invoices WHERE org_id = ? ORDER BY created_at DESC")
    .all(auth.user.orgId);

  const payments = db
    .prepare("SELECT * FROM payments WHERE org_id = ? ORDER BY recorded_at DESC")
    .all(auth.user.orgId);

  const summary = db
    .prepare(
      `SELECT
        COALESCE(SUM(total), 0) as total_billed,
        COALESCE(SUM(amount_paid), 0) as total_collected
       FROM invoices WHERE org_id = ?`
    )
    .get(auth.user.orgId) as { total_billed: number; total_collected: number };

  return NextResponse.json({ invoices, payments, summary });
}

export async function POST(req: Request) {
  const auth = await requireAuth("invoices:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid invoice data" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const { subtotal, total } = computeTotals(d.items, d.discountPercent, d.taxPercent);
  const id = `inv_${crypto.randomUUID()}`;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;
  const now = new Date().toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO invoices (id, org_id, project_id, quotation_id, invoice_number, client_name, client_email, client_company, items_json, subtotal, discount_percent, tax_percent, total, amount_paid, status, due_date, issued_at, notes, share_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Unpaid', ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    auth.user.orgId,
    d.projectId || null,
    d.quotationId || null,
    invoiceNumber,
    d.clientName,
    d.clientEmail,
    d.clientCompany,
    JSON.stringify(d.items),
    subtotal,
    d.discountPercent,
    d.taxPercent,
    total,
    d.dueDate,
    now.slice(0, 10),
    d.notes,
    `share_inv_${crypto.randomBytes(8).toString("hex")}`,
    now,
    now
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "invoice.created",
    entityType: "invoice",
    entityId: id,
    details: { invoiceNumber, total },
  });

  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
  return NextResponse.json({ invoice }, { status: 201 });
}
