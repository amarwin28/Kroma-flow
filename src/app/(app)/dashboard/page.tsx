"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Trophy,
  XCircle,
  IndianRupee,
  FolderKanban,
  FolderCheck,
  CheckSquare,
  Receipt,
  ArrowUpRight,
  Clock,
  FileText,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Badge, Card, Select, StatCard } from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { mockAnalytics } from "@/data/mockAnalytics";
import { formatINR, formatIndianDate } from "@/data/format";

const STAGES = ["Discovery", "Qualified", "Proposal", "Negotiation", "Won"] as const;

export default function DashboardPage() {
  const { state, dashboardKpis } = useDemoData();
  const [days, setDays] = useState("30");
  const [ownerFilter, setOwnerFilter] = useState("");

  const filteredDeals = ownerFilter
    ? state.deals.filter((d) => d.assignedTo === ownerFilter)
    : state.deals;

  const pipeline = STAGES.map((stage) => {
    const items = filteredDeals.filter((d) => d.stage === stage);
    return {
      stage,
      count: items.length,
      value: items.reduce((s, d) => s + d.value, 0),
    };
  });

  const maxStageVal = Math.max(1, ...pipeline.map((p) => p.value));
  const maxRev = Math.max(1, ...mockAnalytics.monthlyRevenueSeries.map((m) => m.revenue));
  const maxGrowth = Math.max(1, ...mockAnalytics.monthlyBusinessGrowth.map((g) => g.growthPct));

  const upcomingTasks = state.tasks
    .filter((t) => t.status !== "Completed" && (!ownerFilter || t.assignedTo === ownerFilter))
    .slice(0, 5);
  const pendingQuotations = state.quotations
    .filter((q) => q.status === "Sent" || q.status === "Draft")
    .slice(0, 4);
  const unpaidInvoices = state.invoices.filter((i) => i.status !== "Paid").slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Executive Dashboard
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            KROMAXZON TECHNOLOGIES · Simulated overview from lead acquisition to payment collection.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            aria-label="Date range"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-36"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </Select>
          <Select
            aria-label="Filter by owner"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-44"
          >
            <option value="">All team owners</option>
            {state.teamMembers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Primary KPI Grid (All 9 requested metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Leads"
          value={dashboardKpis.totalLeads.toLocaleString("en-IN")}
          subtext={`${dashboardKpis.newLeads} New Leads (${days}d)`}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="New Leads"
          value={dashboardKpis.newLeads.toLocaleString("en-IN")}
          subtext="Fresh inbound & outbound inquiries"
          icon={<UserPlus className="w-5 h-5" />}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatINR(dashboardKpis.monthlyRevenue)}
          subtext="+14.2% vs last month (Demo)"
          icon={<IndianRupee className="w-5 h-5" />}
        />
        <StatCard
          label="Won Deals"
          value={dashboardKpis.wonDeals.toLocaleString("en-IN")}
          subtext={`${dashboardKpis.lostDeals} Lost Deals`}
          icon={<Trophy className="w-5 h-5" />}
        />
        <StatCard
          label="Lost Deals"
          value={dashboardKpis.lostDeals.toLocaleString("en-IN")}
          subtext="11.4% loss ratio across pipeline"
          icon={<XCircle className="w-5 h-5" />}
        />
        <StatCard
          label="Active Projects"
          value={dashboardKpis.activeProjects}
          subtext={`${dashboardKpis.completedProjects} Completed Projects`}
          icon={<FolderKanban className="w-5 h-5" />}
        />
        <StatCard
          label="Completed Projects"
          value={dashboardKpis.completedProjects}
          subtext="Delivered on schedule"
          icon={<FolderCheck className="w-5 h-5" />}
        />
        <StatCard
          label="Pending Tasks"
          value={dashboardKpis.pendingTasks}
          subtext="Across active client sprints"
          icon={<CheckSquare className="w-5 h-5" />}
        />
        <StatCard
          label="Pending Invoices"
          value={dashboardKpis.pendingInvoices}
          subtext="Awaiting client settlement"
          icon={<Receipt className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row 1: Monthly Revenue + Sales Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0b1f44]">Monthly Revenue (INR)</h2>
              <p className="text-xs text-slate-500">6-month billed & collected trend</p>
            </div>
            <Badge tone="blue">+14.2% MoM</Badge>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-44 pt-4">
            {mockAnalytics.monthlyRevenueSeries.map((m) => {
              const hPct = Math.round((m.revenue / maxRev) * 100);
              return (
                <div key={m.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-bold text-[#0b1f44] truncate max-w-full">
                    ₹{(m.revenue / 100000).toFixed(1)}L
                  </span>
                  <div className="w-full max-w-[36px] bg-[#eff5ff] rounded-t-lg h-28 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-[#0b1f44] to-[#1d6bff] rounded-t-lg transition-all"
                      style={{ height: `${hPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{m.month}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0b1f44]">Sales Pipeline</h2>
              <p className="text-xs text-slate-500">Live deal volume across stages</p>
            </div>
            <Link
              href="/deals"
              className="text-xs font-semibold text-[#1d6bff] hover:underline inline-flex items-center gap-1"
            >
              Open Kanban <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {pipeline.map((p) => {
              const pct = Math.max(8, Math.round((p.value / maxStageVal) * 100));
              return (
                <div key={p.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0b1f44]">
                      {p.stage} ({p.count})
                    </span>
                    <span className="font-bold text-[#1d6bff]">{formatINR(p.value)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#eff5ff] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1d6bff] to-[#0b1f44]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Charts Row 2: Lead Conversion, Project Completion, Monthly Business Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#0b1f44]">Lead Conversion Funnel</h2>
            <p className="text-xs text-slate-500">26.1% overall lead-to-win conversion</p>
          </div>
          <div className="space-y-2.5">
            {mockAnalytics.leadConversionFunnel.map((f) => (
              <div key={f.stage} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{f.stage}</span>
                  <span className="font-bold text-[#0b1f44]">
                    {f.count.toLocaleString("en-IN")} ({f.pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#eff5ff] overflow-hidden">
                  <div className="h-full rounded-full bg-[#1d6bff]" style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0b1f44]">Project Completion</h2>
              <p className="text-xs text-slate-500">Completed vs active projects</p>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-[#1d6bff] hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-6 gap-2 items-end h-40 pt-2">
            {mockAnalytics.projectCompletionSeries.map((p) => {
              const activeH = Math.round((p.active / 55) * 100);
              const compH = Math.round((p.completed / 10) * 100);
              return (
                <div key={p.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="flex items-end gap-1 h-28">
                    <div
                      className="w-3 bg-[#1d6bff] rounded-t"
                      style={{ height: `${activeH}%` }}
                      title={`Active: ${p.active}`}
                    />
                    <div
                      className="w-3 bg-emerald-500 rounded-t"
                      style={{ height: `${compH}%` }}
                      title={`Completed: ${p.completed}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{p.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1d6bff]" /> Active
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Completed/mo
            </span>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0b1f44]">Monthly Business Growth</h2>
              <p className="text-xs text-slate-500">Net recurring expansion (%)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="grid grid-cols-6 gap-2 items-end h-40 pt-2">
            {mockAnalytics.monthlyBusinessGrowth.map((g) => {
              const hPct = Math.round((g.growthPct / maxGrowth) * 100);
              return (
                <div key={g.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-bold text-emerald-700">+{g.growthPct}%</span>
                  <div className="w-full max-w-[28px] bg-emerald-50 rounded-t-md h-24 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-emerald-500 rounded-t-md"
                      style={{ height: `${hPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{g.month}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Operational Tables & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0b1f44] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1d6bff]" /> Upcoming Tasks
            </h2>
            <Link href="/tasks" className="text-xs font-semibold text-[#1d6bff] hover:underline">
              Manage tasks
            </Link>
          </div>
          <div className="divide-y divide-[#eff5ff]">
            {upcomingTasks.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0b1f44] truncate">{t.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {t.assignedTo} · Due {formatIndianDate(t.dueDate)}
                  </p>
                </div>
                <Badge tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "slate"}>
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0b1f44] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#1d6bff]" /> Pending Invoices
            </h2>
            <Link href="/invoices" className="text-xs font-semibold text-[#1d6bff] hover:underline">
              View invoices
            </Link>
          </div>
          <div className="divide-y divide-[#eff5ff]">
            {unpaidInvoices.map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0b1f44] truncate">
                    {inv.invoiceNumber} — {inv.clientCompany}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Due {formatIndianDate(inv.dueDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-[#0b1f44]">{formatINR(inv.total)}</p>
                  <Badge tone={inv.status === "Overdue" ? "red" : "amber"}>{inv.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0b1f44] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1d6bff]" /> Pending Quotations
            </h2>
            <Link href="/quotations" className="text-xs font-semibold text-[#1d6bff] hover:underline">
              View quotes
            </Link>
          </div>
          <div className="divide-y divide-[#eff5ff]">
            {pendingQuotations.map((q) => (
              <div key={q.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0b1f44] truncate">
                    {q.quoteNumber} · {q.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {q.clientCompany} · Expires {formatIndianDate(q.expiryDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-[#1d6bff]">{formatINR(q.total)}</p>
                  <Badge tone="blue">{q.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0b1f44] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1d6bff]" /> Recent Demo Activity
          </h2>
          <div className="divide-y divide-[#eff5ff]">
            {state.auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#0b1f44] truncate">{log.action}</p>
                  <p className="text-[11px] text-slate-500">
                    {log.actorName} · {log.entityType}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {formatIndianDate(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
