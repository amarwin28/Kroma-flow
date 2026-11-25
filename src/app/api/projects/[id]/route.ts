import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("projects:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();

  // Support milestone creation or toggle in the same endpoint cleanly
  if (body.milestoneTitle) {
    const msId = `ms_${crypto.randomUUID()}`;
    const db = getDb();
    db.prepare(
      `INSERT INTO project_milestones (id, org_id, project_id, title, due_date, completed, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`
    ).run(msId, auth.user.orgId, id, String(body.milestoneTitle), String(body.milestoneDueDate || ""), new Date().toISOString());
    return NextResponse.json({ ok: true, milestoneId: msId }, { status: 201 });
  }

  if (body.toggleMilestoneId) {
    const db = getDb();
    db.prepare(
      `UPDATE project_milestones SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END WHERE id = ? AND project_id = ? AND org_id = ?`
    ).run(String(body.toggleMilestoneId), id, auth.user.orgId);
    return NextResponse.json({ ok: true });
  }

  const parsed = projectSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project update" }, { status: 400 });
  }

  const db = getDb();
  const d = parsed.data;
  db.prepare(
    `UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      progress = COALESCE(?, progress),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      budget = COALESCE(?, budget),
      updated_at = ?
     WHERE id = ? AND org_id = ?`
  ).run(
    d.name ?? null,
    d.description ?? null,
    d.status ?? null,
    d.progress ?? null,
    d.startDate ?? null,
    d.endDate ?? null,
    d.budget ?? null,
    new Date().toISOString(),
    id,
    auth.user.orgId
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "project.updated",
    entityType: "project",
    entityId: id,
  });

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return NextResponse.json({ project });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("projects:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM projects WHERE id = ? AND org_id = ?").run(id, auth.user.orgId);
  return NextResponse.json({ ok: true });
}
