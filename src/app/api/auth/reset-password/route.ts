import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hashPassword } from "@/lib/db";
import { hashToken } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request" },
      { status: 400 }
    );
  }

  const db = getDb();
  const row = db
    .prepare("SELECT * FROM password_resets WHERE token_hash = ? AND used = 0")
    .get(hashToken(parsed.data.token)) as
    | { id: string; user_id: string; expires_at: string }
    | undefined;

  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    hashPassword(parsed.data.password),
    row.user_id
  );
  db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(row.id);

  return NextResponse.json({ ok: true, message: "Password updated successfully" });
}
