import { NextResponse } from "next/server";
import { getDb, verifyPassword } from "@/lib/db";
import { createSession, logAudit, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db
      .prepare("SELECT id, org_id, email, name, password_hash, role, status FROM users WHERE LOWER(email) = LOWER(?)")
      .get(parsed.data.email) as
      | {
          id: string;
          org_id: string;
          email: string;
          name: string;
          password_hash: string;
          role: string;
          status: string;
        }
      | undefined;

    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "Account is suspended" }, { status: 403 });
    }

    const { cookieValue, expiresAt } = createSession(user.id, user.org_id);
    await setSessionCookie(cookieValue, expiresAt);

    logAudit({
      orgId: user.org_id,
      userId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
    });

    return NextResponse.json({
      user: { id: user.id, orgId: user.org_id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
