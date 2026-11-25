import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth("calendar:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const events = db
    .prepare(
      `SELECT e.*, p.name as project_name
       FROM calendar_events e LEFT JOIN projects p ON p.id = e.project_id
       WHERE e.org_id = ? ORDER BY e.start_at ASC`
    )
    .all(auth.user.orgId);

  return NextResponse.json({ events });
}

const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  type: z.enum(["Meeting", "Deadline", "Reminder", "Call"]).default("Meeting"),
  startAt: z.string().min(4),
  endAt: z.string().min(4),
  location: z.string().optional().default(""),
  attendees: z.array(z.string()).optional().default([]),
  reminderMinutes: z.coerce.number().default(15),
});

export async function POST(req: Request) {
  const auth = await requireAuth("calendar:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event details" }, { status: 400 });
  }

  const d = parsed.data;
  const id = `evt_${crypto.randomUUID()}`;
  const db = getDb();

  db.prepare(
    `INSERT INTO calendar_events (id, org_id, title, description, type, start_at, end_at, attendees_json, location, reminder_minutes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    auth.user.orgId,
    d.title,
    d.description,
    d.type,
    d.startAt,
    d.endAt,
    JSON.stringify(d.attendees),
    d.location,
    d.reminderMinutes,
    auth.user.id,
    new Date().toISOString()
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "calendar.event_created",
    entityType: "calendar_event",
    entityId: id,
  });

  const event = db.prepare("SELECT * FROM calendar_events WHERE id = ?").get(id);
  return NextResponse.json({ event }, { status: 201 });
}
