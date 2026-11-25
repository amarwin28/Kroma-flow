import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { runWorkflowsForTrigger } from "@/lib/automation";

const patchSchema = z.object({
  status: z.enum(["Draft", "Sent", "Approved", "Rejected", "Expired"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("quotes:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM quotations WHERE id = ? AND org_id = ?")
    .get(id, auth.user.orgId) as { id: string; status: string } | undefined;
  if (!existing) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  if (parsed.data.status) {
    db.prepare("UPDATE quotations SET status = ?, updated_at = ? WHERE id = ?").run(
      parsed.data.status,
      new Date().toISOString(),
      id
    );
    logAudit({
      orgId: auth.user.orgId,
      userId: auth.user.id,
      action: `quotation.${parsed.data.status.toLowerCase()}`,
      entityType: "quotation",
      entityId: id,
    });

    if (parsed.data.status === "Approved" && existing.status !== "Approved") {
      runWorkflowsForTrigger(auth.user.orgId, "quotation.approved", {
        quotationId: id,
      });
    }
  }

  const quotation = db.prepare("SELECT * FROM quotations WHERE id = ?").get(id);
  return NextResponse.json({ quotation });
}
