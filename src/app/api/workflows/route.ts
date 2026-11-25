import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { runWorkflowsForTrigger } from "@/lib/automation";

export async function GET() {
  const auth = await requireAuth("workflows:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const workflows = db
    .prepare("SELECT * FROM workflows WHERE org_id = ? ORDER BY created_at DESC")
    .all(auth.user.orgId);

  const runs = db
    .prepare(
      `SELECT r.*, w.name as workflow_name
       FROM workflow_runs r JOIN workflows w ON w.id = r.workflow_id
       WHERE r.org_id = ? ORDER BY r.executed_at DESC LIMIT 20`
    )
    .all(auth.user.orgId);

  return NextResponse.json({ workflows, runs });
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(""),
  triggerType: z.enum(["lead.created", "quotation.approved", "deal.won", "invoice.overdue"]),
  conditionField: z.string().optional().default(""),
  conditionValue: z.string().optional().default(""),
  actionType: z.enum(["send_notification", "create_task", "create_project"]),
  actionValue: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireAuth("workflows:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();

  if (body.testTrigger) {
    runWorkflowsForTrigger(auth.user.orgId, String(body.testTrigger), {
      name: "Manual Test Run",
      priority: "High",
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid workflow definition" }, { status: 400 });
  }

  const d = parsed.data;
  const conditions = d.conditionField && d.conditionValue
    ? [{ field: d.conditionField, operator: "equals", value: d.conditionValue }]
    : [];
  const actions = [{ type: d.actionType, value: d.actionValue }];
  const id = `wf_${crypto.randomUUID()}`;
  const db = getDb();

  db.prepare(
    `INSERT INTO workflows (id, org_id, name, description, trigger_type, conditions_json, actions_json, enabled, run_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`
  ).run(
    id,
    auth.user.orgId,
    d.name,
    d.description,
    d.triggerType,
    JSON.stringify(conditions),
    JSON.stringify(actions),
    new Date().toISOString()
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "workflow.created",
    entityType: "workflow",
    entityId: id,
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requireAuth("workflows:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const db = getDb();
  db.prepare(
    "UPDATE workflows SET enabled = ? WHERE id = ? AND org_id = ?"
  ).run(body.enabled ? 1 : 0, String(body.id), auth.user.orgId);

  return NextResponse.json({ ok: true });
}
