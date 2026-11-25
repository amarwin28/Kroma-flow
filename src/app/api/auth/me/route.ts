import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSessionUser, logAudit, requireAuth } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    `UPDATE users SET
      name = COALESCE(?, name),
      job_title = COALESCE(?, job_title),
      phone = COALESCE(?, phone)
     WHERE id = ? AND org_id = ?`
  ).run(
    parsed.data.name ?? null,
    parsed.data.jobTitle ?? null,
    parsed.data.phone ?? null,
    auth.user.id,
    auth.user.orgId
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "profile.updated",
    entityType: "user",
    entityId: auth.user.id,
  });

  const updated = await getSessionUser();
  return NextResponse.json({ user: updated });
}
