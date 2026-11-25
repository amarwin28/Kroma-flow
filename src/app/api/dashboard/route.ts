import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") || "30");
  const ownerId = searchParams.get("ownerId") || "";
  const orgId = auth.user.orgId;
  const db = getDb();

  const sinceIso = new Date(Date.now() - days * 86400000).toISOString();

  const leadWhere = ownerId
    ? "org_id = ? AND created_at >= ? AND owner_id = ?"
    : "org_id = ? AND created_at >= ?";
  const leadParams = ownerId ? [orgId, sinceIso, ownerId] : [orgId, sinceIso];

  const totalLeads = (
    db.prepare(`SELECT COUNT(*) as c FROM leads WHERE ${leadWhere}`).get(...leadParams) as { c: number }
  ).c;

  const wonDealsRow = db
    .prepare(
      `SELECT COUNT(*) as c, COALESCE(SUM(value), 0) as total FROM deals WHERE org_id = ? AND stage = 'Won'`
    )
    .get(orgId) as { c: number; total: number };

  const monthlyRevenueRow = db
    .prepare(
      `SELECT COALESCE(SUM(amount_paid), 0) as paid FROM invoices WHERE org_id = ?`
    )
    .get(orgId) as { paid: number };

  const activeProjects = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM projects WHERE org_id = ? AND status IN ('Planning', 'In Progress')`
      )
      .get(orgId) as { c: number }
  ).c;

  const pipeline = db
    .prepare(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as value
       FROM deals WHERE org_id = ? GROUP BY stage`
    )
    .all(orgId);

  const upcomingTasks = db
    .prepare(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, u.name as assignee_name
       FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.org_id = ? AND t.status != 'Done'
       ORDER BY t.due_date ASC LIMIT 6`
    )
    .all(orgId);

  const pendingQuotations = db
    .prepare(
      `SELECT id, quote_number, title, client_name, total, status, valid_until
       FROM quotations WHERE org_id = ? AND status IN ('Draft', 'Sent')
       ORDER BY created_at DESC LIMIT 5`
    )
    .all(orgId);

  const unpaidInvoices = db
    .prepare(
      `SELECT id, invoice_number, client_name, total, amount_paid, status, due_date
       FROM invoices WHERE org_id = ? AND status != 'Paid'
       ORDER BY due_date ASC LIMIT 5`
    )
    .all(orgId);

  const recentActivity = db
    .prepare(
      `SELECT a.id, a.action, a.entity_type, a.created_at, u.name as actor_name
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.org_id = ? ORDER BY a.created_at DESC LIMIT 8`
    )
    .all(orgId);

  const teamMembers = db
    .prepare("SELECT id, name, role FROM users WHERE org_id = ? AND role != 'client'")
    .all(orgId);

  return NextResponse.json({
    kpis: {
      totalLeads,
      wonDeals: wonDealsRow.c,
      wonValue: wonDealsRow.total,
      monthlyRevenue: monthlyRevenueRow.paid,
      activeProjects,
    },
    pipeline,
    upcomingTasks,
    pendingQuotations,
    unpaidInvoices,
    recentActivity,
    teamMembers,
  });
}
