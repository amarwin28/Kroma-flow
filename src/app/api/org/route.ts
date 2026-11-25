import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth("settings:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const org = db.prepare("SELECT * FROM organisations WHERE id = ?").get(auth.user.orgId);
  const settings = db.prepare("SELECT * FROM org_settings WHERE org_id = ?").get(auth.user.orgId);
  return NextResponse.json({ org, settings });
}

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notificationPrefs: z.record(z.string(), z.boolean()).optional(),
  securityPrefs: z.record(z.string(), z.unknown()).optional(),
  integrations: z.record(z.string(), z.unknown()).optional(),
  billingPlan: z.string().optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireAuth("settings:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid organisation settings" }, { status: 400 });
  }

  const db = getDb();
  const d = parsed.data;
  db.prepare(
    `UPDATE organisations SET
      name = COALESCE(?, name),
      logo_url = COALESCE(?, logo_url),
      primary_color = COALESCE(?, primary_color),
      industry = COALESCE(?, industry),
      website = COALESCE(?, website),
      address = COALESCE(?, address),
      tax_id = COALESCE(?, tax_id)
     WHERE id = ?`
  ).run(
    d.name ?? null,
    d.logoUrl ?? null,
    d.primaryColor ?? null,
    d.industry ?? null,
    d.website ?? null,
    d.address ?? null,
    d.taxId ?? null,
    auth.user.orgId
  );

  if (d.notificationPrefs || d.securityPrefs || d.integrations || d.billingPlan) {
    db.prepare(
      `UPDATE org_settings SET
        notification_prefs_json = COALESCE(?, notification_prefs_json),
        security_prefs_json = COALESCE(?, security_prefs_json),
        integrations_json = COALESCE(?, integrations_json),
        billing_plan = COALESCE(?, billing_plan),
        updated_at = ?
       WHERE org_id = ?`
    ).run(
      d.notificationPrefs ? JSON.stringify(d.notificationPrefs) : null,
      d.securityPrefs ? JSON.stringify(d.securityPrefs) : null,
      d.integrations ? JSON.stringify(d.integrations) : null,
      d.billingPlan ?? null,
      new Date().toISOString(),
      auth.user.orgId
    );
  }

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "organisation.updated",
    entityType: "organisation",
    entityId: auth.user.orgId,
  });

  return NextResponse.json({ ok: true });
}
