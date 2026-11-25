"use client";

import React, { useState } from "react";
import { Download, Target, FolderCheck, Receipt, TrendingUp } from "lucide-react";
import { Badge, Button, Card, Select, StatCard } from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { mockAnalytics } from "@/data/mockAnalytics";
import { formatINR } from "@/data/format";

export default function AnalyticsPage() {
  const { state, dashboardKpis } = useDemoData();
  const [days, setDays] = useState("90");

  const stages = ["Discovery", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
  const dealPerf = stages.map((stage) => {
    const items = state.deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: items.length,
      value: items.reduce((s, d) => s + d.value, 0),
    };
  });

  const totalBilled = state.invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = state.invoices.reduce((s, i) => s + i.amountPaid, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
  const avgProgress =
    state.projects.length > 0
      ? Math.round(state.projects.reduce((s, p) => s + p.progress, 0) / state.projects.length)
      : 0;
  const leadConvRate = Math.round(
    (dashboardKpis.wonDeals / Math.max(1, dashboardKpis.totalLeads)) * 100
  );

  const maxRev = Math.max(1, ...mockAnalytics.monthlyRevenueSeries.map((m) => m.revenue));
  const maxSource = Math.max(1, ...mockAnalytics.leadSourceDistribution.map((s) => s.count));

  function exportCsv() {
    const rows = [
      ["Metric", "Value"],
      ["Total Leads (Demo)", String(dashboardKpis.totalLeads)],
      ["Lead Conversion Rate (%)", String(leadConvRate)],
      ["Monthly Revenue (INR)", String(dashboardKpis.monthlyRevenue)],
      ["Invoice Collection Rate (%)", String(collectionRate)],
      ["Total Billed (INR)", String(totalBilled)],
      ["Total Collected (INR)", String(totalCollected)],
      ["Avg Project Progress (%)", String(avgProgress)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kroma-flow-analytics-${days}d-demo.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Analytics & Reports
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Revenue by month, lead sources, deal conversion, project performance, team productivity & invoice collection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onChange={(e) => setDays(e.target.value)} className="w-36">
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Deal Conversion"
          value={`${leadConvRate}%`}
          subtext={`${dashboardKpis.wonDeals} won of ${dashboardKpis.totalLeads.toLocaleString("en-IN")} leads`}
          icon={<Target className="w-5 h-5" />}
        />
        <StatCard
          label="Invoice Collection"
          value={`${collectionRate}%`}
          subtext={`${formatINR(totalCollected)} of ${formatINR(totalBilled)}`}
          icon={<Receipt className="w-5 h-5" />}
        />
        <StatCard
          label="Project Performance"
          value={`${avgProgress}%`}
          subtext={`${dashboardKpis.activeProjects} active · ${dashboardKpis.completedProjects} completed`}
          icon={<FolderCheck className="w-5 h-5" />}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatINR(dashboardKpis.monthlyRevenue)}
          subtext="Simulated monthly run-rate"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by Month */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0b1f44]">Revenue by Month (INR)</h2>
          <div className="space-y-3">
            {mockAnalytics.monthlyRevenueSeries.map((m) => {
              const pct = Math.round((m.revenue / maxRev) * 100);
              return (
                <div key={m.month} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#0b1f44]">{m.month} 2026</span>
                    <span className="font-bold text-[#1d6bff]">
                      {formatINR(m.revenue)} <span className="text-slate-400 font-normal">/ Target {formatINR(m.target)}</span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#eff5ff] overflow-hidden">
                    <div className="h-full rounded-full bg-[#1d6bff]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Lead Source Distribution */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0b1f44]">Lead Source Distribution</h2>
          <div className="space-y-3">
            {mockAnalytics.leadSourceDistribution.map((s) => {
              const pct = Math.round((s.count / maxSource) * 100);
              return (
                <div key={s.source} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#0b1f44]">{s.source}</span>
                    <span className="font-bold text-slate-600">{s.count} leads</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#eff5ff] overflow-hidden">
                    <div className="h-full rounded-full bg-[#0b1f44]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Deal Conversion by Stage */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0b1f44]">Deal Conversion & Pipeline Value</h2>
          <div className="divide-y divide-[#eff5ff]">
            {dealPerf.map((d) => (
              <div key={d.stage} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0b1f44]">{d.stage}</span>
                  <span className="text-slate-500 ml-2">({d.count} deals)</span>
                </div>
                <span className="font-bold text-[#1d6bff]">{formatINR(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Team Productivity */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0b1f44]">Team Productivity</h2>
          <div className="space-y-3">
            {mockAnalytics.teamProductivity.map((t) => {
              const total = t.completed + t.active;
              const pct = Math.round((t.completed / Math.max(1, total)) * 100);
              return (
                <div key={t.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#0b1f44]">{t.name}</span>
                    <span className="text-slate-600">
                      <strong className="text-emerald-700">{t.completed}</strong> completed · {t.active} active
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#eff5ff] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
