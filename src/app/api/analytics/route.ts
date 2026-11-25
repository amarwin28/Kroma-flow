import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth("analytics:read");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") || "90");
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const orgId = auth.user.orgId;
  const db = getDb();

  const leadStats = db
    .prepare(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) as converted
       FROM leads WHERE org_id = ? AND created_at >= ?`
    )
    .get(orgId, since) as { total: number; converted: number };

  const dealPerf = db
    .prepare(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as value
       FROM deals WHERE org_id = ? GROUP BY stage`
    )
    .all(orgId);

  const invoiceStats = db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) as billed,
              COALESCE(SUM(amount_paid), 0) as collected
       FROM invoices WHERE org_id = ?`
    )
    .get(orgId) as { billed: number; collected: number };

  const projectStats = db
    .prepare(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
              COALESCE(AVG(progress), 0) as avg_progress
       FROM projects WHERE org_id = ?`
    )
    .get(orgId) as { total: number; completed: number; avg_progress: number };

  const acquisitionBySource = db
    .prepare(
      `SELECT source, COUNT(*) as count FROM leads WHERE org_id = ? GROUP BY source`
    )
    .all(orgId);

  const workload = db
    .prepare(
      `SELECT u.name,
              (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = u.id AND t.status != 'Done') as open_tasks
       FROM users u WHERE u.org_id = ? AND u.role != 'client'`
    )
    .all(orgId);

  return NextResponse.json({
    leadConversionRate:
      leadStats.total > 0 ? Math.round(((leadStats.converted || 0) / leadStats.total) * 100) : 0,
    leadStats,
    dealPerf,
    invoiceStats,
    collectionRate:
      invoiceStats.billed > 0
        ? Math.round((invoiceStats.collected / invoiceStats.billed) * 100)
        : 0,
    projectStats,
    acquisitionBySource,
    workload,
  });
}
