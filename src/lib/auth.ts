import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { getEnv } from "./env";

export type UserRole = "owner" | "admin" | "manager" | "sales" | "member" | "client";

export interface AuthUser {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: UserRole;
  jobTitle: string;
  phone: string;
  emailVerified: boolean;
  orgName: string;
  orgSlug: string;
  orgLogoUrl: string;
  orgPrimaryColor: string;
  orgPlan: string;
}

const SESSION_COOKIE = "kroma_session";

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ["*"],
  admin: [
    "crm:read", "crm:write", "deals:read", "deals:write",
    "quotes:read", "quotes:write", "projects:read", "projects:write",
    "tasks:read", "tasks:write", "team:read", "team:write",
    "chat:read", "chat:write", "calendar:read", "calendar:write",
    "invoices:read", "invoices:write", "docs:read", "docs:write",
    "workflows:read", "workflows:write", "analytics:read",
    "settings:read", "settings:write", "ai:use", "audit:read",
  ],
  manager: [
    "crm:read", "deals:read", "quotes:read", "quotes:write",
    "projects:read", "projects:write", "tasks:read", "tasks:write",
    "team:read", "chat:read", "chat:write", "calendar:read", "calendar:write",
    "invoices:read", "docs:read", "docs:write", "workflows:read",
    "analytics:read", "ai:use",
  ],
  sales: [
    "crm:read", "crm:write", "deals:read", "deals:write",
    "quotes:read", "quotes:write", "projects:read", "tasks:read", "tasks:write",
    "team:read", "chat:read", "chat:write", "calendar:read", "calendar:write",
    "invoices:read", "docs:read", "docs:write", "analytics:read", "ai:use",
  ],
  member: [
    "projects:read", "tasks:read", "tasks:write", "team:read",
    "chat:read", "chat:write", "calendar:read", "calendar:write",
    "docs:read", "docs:write", "ai:use",
  ],
  client: [
    "portal:read", "portal:write",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}

function signToken(rawToken: string): string {
  const { authSecret } = getEnv();
  const sig = crypto.createHmac("sha256", authSecret).update(rawToken).digest("hex");
  return `${rawToken}.${sig}`;
}

function verifySignedToken(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const raw = signed.slice(0, idx);
  const expected = signToken(raw);
  const a = Buffer.from(signed);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? raw : null;
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function createSession(userId: string, orgId: string): { cookieValue: string; expiresAt: string } {
  const db = getDb();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const id = `ses_${crypto.randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO sessions (id, token_hash, user_id, org_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, tokenHash, userId, orgId, expiresAt, now.toISOString());

  return { cookieValue: signToken(rawToken), expiresAt };
}

export async function setSessionCookie(cookieValue: string, expiresAt: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) {
    const raw = verifySignedToken(existing);
    if (raw) {
      const db = getDb();
      db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(raw));
    }
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const signed = store.get(SESSION_COOKIE)?.value;
  if (!signed) return null;

  const raw = verifySignedToken(signed);
  if (!raw) return null;

  const db = getDb();
  const tokenHash = hashToken(raw);
  const row = db
    .prepare(
      `SELECT
        u.id, u.org_id, u.email, u.name, u.role, u.job_title, u.phone, u.email_verified, u.status,
        o.name as org_name, o.slug as org_slug, o.logo_url as org_logo_url, o.primary_color as org_primary_color, o.plan as org_plan,
        s.expires_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      JOIN organisations o ON o.id = s.org_id
      WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | {
        id: string;
        org_id: string;
        email: string;
        name: string;
        role: UserRole;
        job_title: string;
        phone: string;
        email_verified: number;
        status: string;
        org_name: string;
        org_slug: string;
        org_logo_url: string;
        org_primary_color: string;
        org_plan: string;
        expires_at: string;
      }
    | undefined;

  if (!row) return null;
  if (row.status !== "active") return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }

  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    name: row.name,
    role: row.role,
    jobTitle: row.job_title || "",
    phone: row.phone || "",
    emailVerified: Boolean(row.email_verified),
    orgName: row.org_name,
    orgSlug: row.org_slug,
    orgLogoUrl: row.org_logo_url || "/brand/kromaxzon-logo.svg",
    orgPrimaryColor: row.org_primary_color || "#1D6BFF",
    orgPlan: row.org_plan || "Enterprise",
  };
}

export async function requireAuth(permission?: string): Promise<{ user: AuthUser } | { error: Response }> {
  const user = await getSessionUser();
  if (!user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (permission && !hasPermission(user.role, permission)) {
    return { error: Response.json({ error: "Forbidden: insufficient permissions" }, { status: 403 }) };
  }
  return { user };
}

export function logAudit(params: {
  orgId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (id, org_id, user_id, action, entity_type, entity_id, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `aud_${crypto.randomUUID()}`,
    params.orgId,
    params.userId ?? null,
    params.action,
    params.entityType,
    params.entityId ?? "",
    JSON.stringify(params.details ?? {}),
    new Date().toISOString()
  );
}
