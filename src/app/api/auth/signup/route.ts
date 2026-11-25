import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, hashPassword } from "@/lib/db";
import { createSession, hashToken, logAudit, setSessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid signup details" },
        { status: 400 }
      );
    }

    const { name, email, password, organisationName, inviteToken } = parsed.data;
    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)")
      .get(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const now = new Date().toISOString();
    let orgId = "";
    let role = "owner";

    if (inviteToken) {
      const invite = db
        .prepare("SELECT * FROM invitations WHERE token = ? AND status = 'pending'")
        .get(inviteToken) as
        | { id: string; org_id: string; email: string; role: string; expires_at: string }
        | undefined;
      if (!invite || new Date(invite.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: "Invalid or expired invitation token" }, { status: 400 });
      }
      orgId = invite.org_id;
      role = invite.role;
      db.prepare("UPDATE invitations SET status = 'accepted' WHERE id = ?").run(invite.id);
    } else {
      if (!organisationName || organisationName.trim().length < 2) {
        return NextResponse.json({ error: "Organisation name is required" }, { status: 400 });
      }
      orgId = `org_${crypto.randomUUID()}`;
      const slugBase = organisationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const slug = `${slugBase}-${crypto.randomBytes(2).toString("hex")}`;

      db.prepare(
        `INSERT INTO organisations (id, name, slug, created_at) VALUES (?, ?, ?, ?)`
      ).run(orgId, organisationName.trim(), slug, now);

      db.prepare(`INSERT INTO org_settings (org_id, updated_at) VALUES (?, ?)`).run(orgId, now);
      db.prepare(
        `INSERT INTO channels (id, org_id, name, type, created_at) VALUES (?, ?, 'general', 'team', ?)`
      ).run(`ch_${crypto.randomUUID()}`, orgId, now);
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passHash = hashPassword(password);

    db.prepare(
      `INSERT INTO users (id, org_id, email, name, password_hash, role, email_verified, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'active', ?)`
    ).run(userId, orgId, email.toLowerCase(), name.trim(), passHash, role, now);

    // Create email verification token
    const rawVerify = crypto.randomBytes(24).toString("hex");
    db.prepare(
      `INSERT INTO email_verifications (id, user_id, token_hash, expires_at, verified, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(
      `ev_${crypto.randomUUID()}`,
      userId,
      hashToken(rawVerify),
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      now
    );

    const { cookieValue, expiresAt } = createSession(userId, orgId);
    await setSessionCookie(cookieValue, expiresAt);

    logAudit({
      orgId,
      userId,
      action: "auth.signup",
      entityType: "user",
      entityId: userId,
      details: { role, viaInvite: Boolean(inviteToken) },
    });

    return NextResponse.json(
      {
        user: { id: userId, orgId, email: email.toLowerCase(), name: name.trim(), role },
        verificationTokenPreview: rawVerify,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
