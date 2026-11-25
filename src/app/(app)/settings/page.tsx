"use client";

import React, { useState } from "react";
import { Building2, RotateCcw, History, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { formatIndianDateTime } from "@/data/format";

export default function SettingsPage() {
  const { state, updateOrgSettings, resetDemoData } = useDemoData();
  const [name, setName] = useState(state.orgSettings.name);
  const [industry, setIndustry] = useState(state.orgSettings.industry);
  const [website, setWebsite] = useState(state.orgSettings.website);
  const [toast, setToast] = useState("");

  function saveOrg(e: React.FormEvent) {
    e.preventDefault();
    updateOrgSettings({ name, industry, website });
    setToast("Organisation settings saved to local demo storage.");
  }

  function handleReset() {
    resetDemoData();
    setName("KROMAXZON TECHNOLOGIES");
    setIndustry("B2B SaaS & Digital Solutions");
    setWebsite("https://kromaxzon.in");
    setToast("All demo data restored to original sample dataset.");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
            Settings & Demo Controls
          </h1>
          <Badge tone="amber">DEMO DATA</Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage KROMAXZON TECHNOLOGIES workspace branding, localStorage state, and demo reset.
        </p>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1d6bff]">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1d6bff]" />
            <h2 className="text-sm font-bold text-[#0b1f44]">Organisation Profile</h2>
          </div>
          <form onSubmit={saveOrg} className="space-y-3">
            <Input
              label="Organisation Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            <Input
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <Button type="submit">Save Branding</Button>
          </form>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-[#0b1f44]">Demo Environment & Reset</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            KROMA FLOW is currently running in <strong>Local Demo Mode</strong> using
            organised mock TypeScript datasets and browser <code className="px-1 py-0.5 rounded bg-slate-100">localStorage</code>.
            No external database, Supabase, Firebase, or backend API is connected. All leads,
            deals, revenue figures, and invoices are <strong>DEMO DATA</strong>.
          </p>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 text-[#1d6bff]" /> Reset Demo Data
          </Button>
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#1d6bff]" />
          <h2 className="text-sm font-bold text-[#0b1f44]">Demo Activity Log</h2>
        </div>
        <div className="divide-y divide-[#eff5ff]">
          {state.auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-[#0b1f44]">{log.action}</p>
                <p className="text-slate-500">
                  {log.actorName} · {log.entityType}
                </p>
              </div>
              <span className="text-slate-400 shrink-0">
                {formatIndianDateTime(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
