import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hashToken } from "@/lib/auth";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)")
    .get(parsed.data.email) as { id: string } | undefined;

  if (!user) {
    // Do not leak user existence
    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been generated.",
    });
  }

  const rawToken = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  db.prepare(
    `INSERT INTO password_resets (id, user_id, token_hash, expires_at, used, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).run(
    `pr_${crypto.randomUUID()}`,
    user.id,
    hashToken(rawToken),
    new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    now.toISOString()
  );

  return NextResponse.json({
    message: "If an account exists for that email, a reset link has been generated.",
    demoResetToken: process.env.NODE_ENV === "production" ? undefined : rawToken,
  });
}
