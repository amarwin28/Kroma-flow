"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  FolderKanban,
  CheckSquare,
  UserCog,
  MessageSquare,
  Calendar,
  Receipt,
  Globe,
  Cloud,
  Sparkles,
  Workflow,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { useDemoData } from "@/context/DemoDataContext";
import { mockAiSuggestions } from "@/data/mockNotifications";
import { formatINR } from "@/data/format";

export interface ShellUser {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: string;
  jobTitle: string;
  orgName: string;
  orgLogoUrl: string;
  orgPlan: string;
}

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/leads", label: "CRM & Leads", icon: Users },
      { href: "/deals", label: "Deals Pipeline", icon: Briefcase },
      { href: "/quotations", label: "Quotations", icon: FileText },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/chat", label: "Team Chat", icon: MessageSquare },
    ],
  },
  {
    label: "Finance & Client",
    items: [
      { href: "/invoices", label: "Invoices", icon: Receipt },
      { href: "/portal", label: "Client Portal", icon: Globe },
      { href: "/documents", label: "Cloud & Docs", icon: Cloud },
    ],
  },
  {
    label: "Intelligence & Admin",
    items: [
      { href: "/workflows", label: "Automations", icon: Workflow },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/team", label: "Team & Roles", icon: UserCog },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const MOBILE_BOTTOM_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leads", label: "CRM", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/invoices", label: "Finance", icon: Receipt },
];

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    state,
    dashboardKpis,
    markNotificationRead,
    markAllNotificationsRead,
    resetDemoData,
  } = useDemoData();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [tabletCollapsed, setTabletCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello! I'm KROMA AI (Simulated Demo Assistant). Review the suggested actions below or ask me about leads, deals, quotations, tasks, or project progress.",
    },
  ]);

  const unreadCount = state.notifications.filter((n) => !n.read).length;
  const orgName = state.orgSettings.name || user.orgName;
  const orgLogoUrl = state.orgSettings.logoUrl || user.orgLogoUrl;

  function handleLogout() {
    router.push("/");
  }

  function generateSimulatedAiReply(prompt: string): string {
    const q = prompt.toLowerCase();
    if (q.includes("lead") || q.includes("follow")) {
      const qualified = state.leads.filter((l) => l.status === "Qualified");
      return `[Simulated AI Suggestion — DEMO DATA]\nYou have ${qualified.length} Qualified leads ready for follow-up:\n${qualified
        .slice(0, 4)
        .map((l) => `• ${l.name} (${l.company}) — ${formatINR(l.estimatedValue)} · Follow-up: ${l.followUpDate}`)
        .join("\n")}`;
    }
    if (q.includes("quotation") || q.includes("quote")) {
      const pending = state.quotations.filter((qt) => qt.status === "Sent");
      return `[Simulated AI Suggestion — DEMO DATA]\n${pending.length} quotations are awaiting client approval:\n${pending
        .slice(0, 4)
        .map((qt) => `• ${qt.quoteNumber} (${qt.clientCompany}) — ${formatINR(qt.total)} (Expires ${qt.expiryDate})`)
        .join("\n")}`;
    }
    if (q.includes("task") || q.includes("overdue")) {
      const open = state.tasks.filter((t) => t.status !== "Completed");
      return `[Simulated AI Suggestion — DEMO DATA]\n${open.length} active tasks in workspace (${dashboardKpis.pendingTasks} pending on dashboard). Top priorities:\n${open
        .filter((t) => t.priority === "High")
        .slice(0, 4)
        .map((t) => `• ${t.title} (${t.assignedTo} · Due ${t.dueDate})`)
        .join("\n")}`;
    }
    if (q.includes("project") || q.includes("progress")) {
      return `[Simulated AI Suggestion — DEMO DATA]\nProject Portfolio: ${dashboardKpis.activeProjects} Active · ${dashboardKpis.completedProjects} Completed.\nTop active deliveries:\n${state.projects
        .filter((p) => p.status === "In Progress")
        .slice(0, 4)
        .map((p) => `• ${p.name} (${p.client}) — ${p.progress}% complete`)
        .join("\n")}`;
    }
    const negDeals = state.deals.filter((d) => d.stage === "Negotiation");
    const negVal = negDeals.reduce((s, d) => s + d.value, 0);
    return `[Simulated AI Suggestion — DEMO DATA]\nPipeline Snapshot:\n• Total Leads: ${dashboardKpis.totalLeads.toLocaleString("en-IN")} (${dashboardKpis.newLeads} New)\n• Won Deals: ${dashboardKpis.wonDeals} | Negotiation: ${negDeals.length} deals (${formatINR(negVal)})\n• Monthly Revenue: ${formatINR(dashboardKpis.monthlyRevenue)}\n• Pending Invoices: ${dashboardKpis.pendingInvoices}`;
  }

  function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const q = aiPrompt.trim();
    setAiPrompt("");
    const reply = generateSimulatedAiReply(q);
    setAiMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: reply },
    ]);
  }

  const sidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full bg-[#0b1f44] text-white select-none">
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
        <BrandLogo
          logoUrl={orgLogoUrl}
          orgName={orgName}
          variant="light"
          compact={collapsed}
        />
        <button
          onClick={() => setTabletCollapsed(!collapsed)}
          className="hidden md:flex lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-blue-200 cursor-pointer"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Primary Navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-300/60">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-[#1d6bff] text-white shadow-md shadow-blue-900/40"
                        : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-blue-200/80 truncate capitalize">
              {user.role} · {user.orgPlan}
            </p>
          </div>
        )}
        <button
          onClick={resetDemoData}
          title="Reset Demo Data"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 hover:text-white transition cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Reset Demo Data</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-200 hover:bg-white/10 hover:text-white transition cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Exit Demo</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#f4f8ff] overflow-x-hidden">
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:block shrink-0 sticky top-0 h-screen transition-all duration-200 ${
          tabletCollapsed ? "w-[74px] lg:w-64" : "w-64"
        }`}
      >
        {sidebarContent(tabletCollapsed)}
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#081633]/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute top-3.5 right-3 z-20 p-2 rounded-lg bg-white/10 text-white"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent(false)}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-[#dce7f8] px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl border border-[#dce7f8] text-[#0b1f44] hover:bg-[#eff5ff]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden min-w-0">
              <BrandLogo logoUrl={orgLogoUrl} orgName={orgName} />
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 min-w-0">
              <span className="font-semibold text-[#0b1f44] truncate">{orgName}</span>
              <span>/</span>
              <span className="text-[#1d6bff] font-semibold truncate">From Lead to Payment — Seamlessly</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800"
              title="All figures and records are simulated demo data"
            >
              DEMO DATA
            </span>
            <button
              onClick={resetDemoData}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#dce7f8] bg-white hover:bg-[#eff5ff] text-xs font-semibold text-[#0b1f44] cursor-pointer"
              title="Restore original sample dataset"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#1d6bff]" />
              <span>Reset Demo</span>
            </button>
            <button
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#1d6bff] to-[#0b1f44] text-white text-xs font-semibold shadow-sm hover:opacity-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">KROMA AI</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-xl border border-[#dce7f8] bg-white hover:bg-[#eff5ff] text-[#0b1f44] cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1d6bff] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#dce7f8] shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#dce7f8] flex items-center justify-between bg-[#f4f8ff]">
                    <div>
                      <p className="text-xs font-bold text-[#0b1f44]">Notifications (Demo)</p>
                      <p className="text-[11px] text-slate-500">{unreadCount} unread updates</p>
                    </div>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-[#1d6bff] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#eff5ff]">
                    {state.notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifOpen(false);
                        }}
                        className={`block px-4 py-3 hover:bg-[#f4f8ff] transition ${
                          n.read ? "opacity-70" : "bg-blue-50/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1d6bff]">
                            {n.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{n.timeAgo}</span>
                        </div>
                        <p className="text-xs font-bold text-[#0b1f44] mt-0.5">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#dce7f8] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(11,31,68,0.06)]"
        aria-label="Mobile Bottom Navigation"
      >
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold ${
                active ? "text-[#1d6bff] bg-[#eff5ff]" : "text-slate-500"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Slide-over */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#081633]/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#dce7f8]">
            <div className="px-5 py-4 border-b border-[#dce7f8] bg-gradient-to-r from-[#0b1f44] to-[#122c5c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-300" />
                <div>
                  <h2 className="text-sm font-bold">KROMA AI Assistant</h2>
                  <p className="text-[11px] text-blue-200">Simulated AI Suggestions · DEMO DATA</p>
                </div>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Simulated AI suggestions for product demonstration. Human review required.</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Simulated AI Suggestions Cards */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Simulated AI Suggestions
                </p>
                {mockAiSuggestions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[#f4f8ff] border border-[#dce7f8] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#1d6bff]">
                        {s.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        Simulated
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#0b1f44]">{s.title}</p>
                    <p className="text-[11px] text-slate-600">{s.summary}</p>
                    <Link
                      href={s.href}
                      onClick={() => setAiOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1d6bff] hover:underline pt-0.5"
                    >
                      <span>{s.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#dce7f8] pt-3 space-y-2.5">
                {aiMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#1d6bff] text-white ml-8"
                        : "bg-[#f4f8ff] border border-[#dce7f8] text-[#0b1f44] mr-6"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-[#dce7f8] bg-white space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Follow up qualified leads",
                  "Pending quotations",
                  "Overdue tasks",
                  "Project progress summary",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAiPrompt(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#eff5ff] text-[#1d6bff] font-semibold hover:bg-[#dbeafe] cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAiSubmit} className="flex gap-2">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask KROMA AI about leads, deals, projects..."
                  className="flex-1 min-h-[42px] px-3.5 rounded-xl border border-[#dce7f8] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d6bff]/30"
                />
                <button
                  type="submit"
                  className="px-3.5 rounded-xl bg-[#1d6bff] text-white hover:bg-[#1558d6] cursor-pointer"
                  aria-label="Send prompt"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
