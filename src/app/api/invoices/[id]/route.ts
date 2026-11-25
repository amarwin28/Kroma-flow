import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
  method: z.string().min(2),
  reference: z.string().min(3, "Provider confirmation reference is required"),
  confirmedByProvider: z.boolean(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("invoices:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();

  if (body.sendReminder) {
    logAudit({
      orgId: auth.user.orgId,
      userId: auth.user.id,
      action: "invoice.reminder_sent",
      entityType: "invoice",
      entityId: id,
    });
    return NextResponse.json({ ok: true, message: "Payment reminder logged and queued." });
  }

  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid payment data" },
      { status: 400 }
    );
  }

  const db = getDb();
  const inv = db
    .prepare("SELECT * FROM invoices WHERE id = ? AND org_id = ?")
    .get(id, auth.user.orgId) as
    | { id: string; total: number; amount_paid: number; invoice_number: string }
    | undefined;

  if (!inv) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const d = parsed.data;
  const now = new Date().toISOString();
  const paymentStatus = d.confirmedByProvider ? "Confirmed" : "Pending Provider Confirmation";

  db.prepare(
    `INSERT INTO payments (id, org_id, invoice_id, amount, method, reference, status, confirmed_by_provider, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `pay_${crypto.randomUUID()}`,
    auth.user.orgId,
    inv.id,
    d.amount,
    d.method,
    d.reference,
    paymentStatus,
    d.confirmedByProvider ? 1 : 0,
    now
  );

  // Only mark invoice Paid / increment amount_paid when confirmed by provider
  if (d.confirmedByProvider) {
    const newPaid = Math.min(inv.total, inv.amount_paid + d.amount);
    const newStatus = newPaid >= inv.total ? "Paid" : "Partial";
    db.prepare(
      "UPDATE invoices SET amount_paid = ?, status = ?, updated_at = ? WHERE id = ?"
    ).run(newPaid, newStatus, now, inv.id);
  }

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: d.confirmedByProvider ? "payment.confirmed" : "payment.pending_confirmation",
    entityType: "invoice",
    entityId: inv.id,
    details: { amount: d.amount, reference: d.reference },
  });

  return NextResponse.json({
    ok: true,
    status: paymentStatus,
    message: d.confirmedByProvider
      ? "Payment confirmed and invoice updated."
      : "Payment recorded as pending until provider confirmation is received.",
  });
}
