import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { taskSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const auth = await requireAuth("tasks:read");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";

  const db = getDb();
  let sql = `SELECT t.*, u.name as assignee_name, p.name as project_name
             FROM tasks t
             LEFT JOIN users u ON u.id = t.assignee_id
             LEFT JOIN projects p ON p.id = t.project_id
             WHERE t.org_id = ?`;
  const params: string[] = [auth.user.orgId];

  if (status) {
    sql += " AND t.status = ?";
    params.push(status);
  }
  if (priority) {
    sql += " AND t.priority = ?";
    params.push(priority);
  }
  sql += " ORDER BY t.due_date ASC, t.created_at DESC";

  const tasks = db.prepare(sql).all(...params);
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const auth = await requireAuth("tasks:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid task data" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const id = `task_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(
    `INSERT INTO tasks (id, org_id, project_id, title, description, assignee_id, status, priority, due_date, subtasks_json, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    auth.user.orgId,
    d.projectId || null,
    d.title,
    d.description,
    d.assigneeId || auth.user.id,
    d.status,
    d.priority,
    d.dueDate,
    JSON.stringify(d.subtasks),
    auth.user.id,
    now,
    now
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "task.created",
    entityType: "task",
    entityId: id,
  });

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return NextResponse.json({ task }, { status: 201 });
}
