import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logAudit, requireAuth } from "@/lib/auth";

const aiSchema = z.object({
  prompt: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireAuth("ai:use");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = aiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const prompt = parsed.data.prompt.trim();
  const orgId = auth.user.orgId;
  const db = getDb();

  // Gather authorised workspace context strictly scoped to orgId
  const leads = db
    .prepare("SELECT name, company, status, priority, estimated_value FROM leads WHERE org_id = ? LIMIT 10")
    .all(orgId) as Array<{ name: string; company: string; status: string; priority: string; estimated_value: number }>;

  const deals = db
    .prepare("SELECT title, company, stage, value FROM deals WHERE org_id = ? LIMIT 10")
    .all(orgId) as Array<{ title: string; company: string; stage: string; value: number }>;

  const projects = db
    .prepare("SELECT name, status, progress, client_name FROM projects WHERE org_id = ? LIMIT 10")
    .all(orgId) as Array<{ name: string; status: string; progress: number; client_name: string }>;

  const tasks = db
    .prepare("SELECT title, status, priority, due_date FROM tasks WHERE org_id = ? AND status != 'Done' LIMIT 10")
    .all(orgId) as Array<{ title: string; status: string; priority: string; due_date: string }>;

  const unpaid = db
    .prepare("SELECT invoice_number, client_name, total, amount_paid, due_date FROM invoices WHERE org_id = ? AND status != 'Paid' LIMIT 10")
    .all(orgId) as Array<{ invoice_number: string; client_name: string; total: number; amount_paid: number; due_date: string }>;

  logAudit({
    orgId,
    userId: auth.user.id,
    action: "ai.query",
    entityType: "ai_assistant",
    details: { promptLength: prompt.length },
  });

  // If external Gemini key is configured in server env, call it with workspace context
  const { geminiApiKey } = getEnv();
  if (geminiApiKey) {
    try {
      const context = JSON.stringify({ leads, deals, projects, openTasks: tasks, unpaidInvoices: unpaid });
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are KROMA AI inside KROMA FLOW for ${auth.user.orgName}. Answer concisely using ONLY this authorised workspace data: ${context}. Always remind the user to review before sending external messages or taking financial actions.\n\nUser request: ${prompt}`,
                  },
                ],
              },
            ],
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return NextResponse.json({ reply: text, mode: "gemini" });
        }
      }
    } catch {
      // Fall back to deterministic workspace intelligence
    }
  }

  // Deterministic workspace-grounded intelligence
  const lower = prompt.toLowerCase();
  let reply = "";

  if (lower.includes("pipeline") || lower.includes("deal") || lower.includes("sales")) {
    const totalVal = deals.reduce((s, d) => s + Number(d.value || 0), 0);
    const won = deals.filter((d) => d.stage === "Won");
    reply =
      `Pipeline Summary for ${auth.user.orgName}:\n` +
      `• Active Deals: ${deals.length} ($${totalVal.toLocaleString()} total)\n` +
      `• Won Deals: ${won.length} ($${won.reduce((s, d) => s + d.value, 0).toLocaleString()})\n` +
      deals.map((d) => `  - ${d.title} (${d.stage}): $${d.value.toLocaleString()}`).join("\n");
  } else if (lower.includes("follow") || lower.includes("draft") || lower.includes("proposal")) {
    const targetLead = leads[0];
    reply =
      `Draft Follow-Up (Human Review Required Before Sending):\n\n` +
      `Subject: Next steps with ${auth.user.orgName}\n` +
      `Hi ${targetLead ? targetLead.name : "there"},\n\n` +
      `Following up on our recent conversation regarding ${targetLead?.company || "your upcoming rollout"}. ` +
      `We'd love to schedule a 20-minute review to finalize scope and timeline.\n\n` +
      `Best regards,\n${auth.user.name}`;
  } else if (lower.includes("project") || lower.includes("status")) {
    reply =
      `Project Status Summary:\n` +
      (projects.length
        ? projects
            .map((p) => `• ${p.name} (${p.client_name || "Internal"}): ${p.status} — ${p.progress}% complete`)
            .join("\n")
        : "No active projects found.");
  } else if (lower.includes("action") || lower.includes("task")) {
    reply =
      `Extracted Open Action Items (${tasks.length}):\n` +
      (tasks.length
        ? tasks.map((t) => `• [${t.priority}] ${t.title} (Due: ${t.due_date || "TBD"})`).join("\n")
        : "No open tasks.");
  } else {
    reply =
      `Workspace Snapshot (${auth.user.orgName}):\n` +
      `• Leads: ${leads.length} | Deals: ${deals.length} | Active Projects: ${projects.length}\n` +
      `• Open Tasks: ${tasks.length} | Unpaid Invoices: ${unpaid.length}\n\n` +
      `Try asking: "Summarize pipeline", "Draft follow-up", "Project status summary", or "Extract action items".`;
  }

  return NextResponse.json({ reply, mode: "workspace-engine" });
}
