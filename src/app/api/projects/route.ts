import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAuth("projects:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const projects = db
    .prepare(
      `SELECT p.*, u.name as manager_name
       FROM projects p LEFT JOIN users u ON u.id = p.manager_id
       WHERE p.org_id = ? ORDER BY p.created_at DESC`
    )
    .all(auth.user.orgId) as Array<Record<string, unknown>>;

  const milestones = db
    .prepare("SELECT * FROM project_milestones WHERE org_id = ? ORDER BY due_date ASC")
    .all(auth.user.orgId) as Array<{ project_id: string }>;

  const enriched = projects.map((p) => ({
    ...p,
    milestones: milestones.filter((m) => m.project_id === p.id),
  }));

  return NextResponse.json({ projects: enriched });
}

export async function POST(req: Request) {
  const auth = await requireAuth("projects:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid project data" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const id = `proj_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(
    `INSERT INTO projects (id, org_id, name, description, client_name, client_email, status, progress, start_date, end_date, manager_id, budget, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    auth.user.orgId,
    d.name,
    d.description,
    d.clientName,
    d.clientEmail,
    d.status,
    d.progress,
    d.startDate,
    d.endDate,
    d.managerId || auth.user.id,
    d.budget,
    now,
    now
  );

  // Create a project chat channel automatically
  db.prepare(
    `INSERT INTO channels (id, org_id, name, type, project_id, created_at)
     VALUES (?, ?, ?, 'project', ?, ?)`
  ).run(
    `ch_${crypto.randomUUID()}`,
    auth.user.orgId,
    `proj-${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`,
    id,
    now
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "project.created",
    entityType: "project",
    entityId: id,
    details: { name: d.name },
  });

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return NextResponse.json({ project }, { status: 201 });
}
