import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hashToken } from "@/lib/auth";

const schema = z.object({ token: z.string().min(6) });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const db = getDb();
  const row = db
    .prepare("SELECT * FROM email_verifications WHERE token_hash = ? AND verified = 0")
    .get(hashToken(parsed.data.token)) as
    | { id: string; user_id: string; expires_at: string }
    | undefined;

  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
  }

  db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(row.user_id);
  db.prepare("UPDATE email_verifications SET verified = 1 WHERE id = ?").run(row.id);

  return NextResponse.json({ ok: true, message: "Email verified successfully" });
}
