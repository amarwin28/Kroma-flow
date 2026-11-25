import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f8ff] via-white to-[#eff5ff] text-[#0b1f44]">
      <header className="border-b border-[#dce7f8] bg-white/85 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-[#0b1f44] hover:bg-[#eff5ff] transition"
            >
              Demo Workspace
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1d6bff] text-white hover:bg-[#1558d6] shadow-sm transition"
            >
              Launch KROMA FLOW
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eff5ff] border border-[#dce7f8] text-xs font-bold text-[#1d6bff]">
            <span>OFFICIAL PRODUCT OF KROMAXZON TECHNOLOGIES</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0b1f44] leading-tight">
            KROMA FLOW — From Lead to Payment,{" "}
            <span className="text-[#1d6bff]">Seamlessly.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            One unified B2B SaaS platform for CRM, deal pipelines, quotations, project delivery,
            team collaboration, client portals, invoicing, AI assistance, and workflow automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1d6bff] text-white font-semibold hover:bg-[#1558d6] shadow-md shadow-blue-600/20 transition"
            >
              <span>Launch Workspace (Demo)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/leads"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-[#dce7f8] text-[#0b1f44] font-semibold hover:bg-[#eff5ff] transition"
            >
              <span>Explore CRM & Leads</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          {[
            {
              icon: CheckCircle2,
              title: "Lead to Invoice",
              desc: "Convert leads to deals, proposals, projects, and confirmed payments in one flow.",
            },
            {
              icon: ShieldCheck,
              title: "Tenant & Role Isolation",
              desc: "Organisation-scoped database isolation, RBAC permissions, and dedicated Client Portal.",
            },
            {
              icon: Sparkles,
              title: "KROMA AI Assistant",
              desc: "Workspace-grounded summaries, follow-up drafts, and action extraction with human review.",
            },
            {
              icon: Workflow,
              title: "Visual Automations",
              desc: "Trigger-condition-action workflows with live execution logs and zero manual handoffs.",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-5 rounded-2xl bg-white border border-[#dce7f8] shadow-[0_2px_12px_-4px_rgba(11,31,68,0.06)]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff5ff] text-[#1d6bff] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-[#0b1f44]">{f.title}</h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
