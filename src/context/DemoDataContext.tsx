"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { mockUsers, MockTeamMember } from "@/data/mockUsers";
import { mockClients, MockClient } from "@/data/mockClients";
import { mockLeads, MockLead, LeadStatus } from "@/data/mockLeads";
import { mockDeals, MockDeal, DealStage } from "@/data/mockDeals";
import { mockProjects, MockProject } from "@/data/mockProjects";
import { mockTasks, MockTask, TaskStatus } from "@/data/mockTasks";
import { mockQuotations, MockQuotation, MockQuoteItem } from "@/data/mockQuotations";
import { mockInvoices, MockInvoice } from "@/data/mockInvoices";
import { mockCalendarEvents, MockCalendarEvent } from "@/data/mockCalendar";
import {
  mockNotifications,
  mockChatChannels,
  mockChatMessages,
  MockNotification,
  MockChatChannel,
  MockChatMessage,
} from "@/data/mockNotifications";
import { mockDashboardBaseline } from "@/data/mockAnalytics";
import { getInitials } from "@/data/format";

const STORAGE_KEY = "kroma_flow_demo_state_v1";

export interface OrgSettings {
  name: string;
  industry: string;
  website: string;
  logoUrl: string;
  plan: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  actorName: string;
  createdAt: string;
}

export interface DemoState {
  leads: MockLead[];
  deals: MockDeal[];
  projects: MockProject[];
  tasks: MockTask[];
  quotations: MockQuotation[];
  invoices: MockInvoice[];
  teamMembers: MockTeamMember[];
  clients: MockClient[];
  calendarEvents: MockCalendarEvent[];
  chatChannels: MockChatChannel[];
  chatMessages: MockChatMessage[];
  notifications: MockNotification[];
  orgSettings: OrgSettings;
  auditLogs: AuditEntry[];
}

function buildInitialState(): DemoState {
  return {
    leads: mockLeads,
    deals: mockDeals,
    projects: mockProjects,
    tasks: mockTasks,
    quotations: mockQuotations,
    invoices: mockInvoices,
    teamMembers: mockUsers,
    clients: mockClients,
    calendarEvents: mockCalendarEvents,
    chatChannels: mockChatChannels,
    chatMessages: mockChatMessages,
    notifications: mockNotifications,
    orgSettings: {
      name: "KROMAXZON TECHNOLOGIES",
      industry: "B2B SaaS & Digital Solutions",
      website: "https://kromaxzon.in",
      logoUrl: "/logo-kmx.jpg",
      plan: "Enterprise Demo",
    },
    auditLogs: [
      {
        id: "aud-1",
        action: "Demo dataset initialized for KROMA FLOW",
        entityType: "Workspace",
        actorName: "Aarav Kulkarni",
        createdAt: "2026-11-25T09:00:00",
      },
      {
        id: "aud-2",
        action: "Marked INV-1043 (TechCorp Solutions) as Paid",
        entityType: "Invoice",
        actorName: "Pooja Bansal",
        createdAt: "2026-11-25T14:25:00",
      },
      {
        id: "aud-3",
        action: "Approved Quotation QT-1014 (Digital Edge)",
        entityType: "Quotation",
        actorName: "Arjun Nair",
        createdAt: "2026-11-25T11:50:00",
      },
    ],
  };
}

interface DemoContextValue {
  state: DemoState;
  hydrated: boolean;
  dashboardKpis: typeof mockDashboardBaseline;
  // Leads
  addLead: (input: Omit<MockLead, "id" | "leadCode" | "createdDate">) => void;
  updateLead: (id: string, patch: Partial<MockLead>) => void;
  deleteLead: (id: string) => void;
  convertLeadToDeal: (id: string) => void;
  // Deals
  addDeal: (input: Omit<MockDeal, "id">) => void;
  moveDealStage: (id: string, stage: DealStage) => void;
  // Projects
  addProject: (input: Omit<MockProject, "id" | "projectCode" | "milestones">) => void;
  updateProjectProgress: (id: string, progress: number, status?: MockProject["status"]) => void;
  addProjectMilestone: (projectId: string, title: string) => void;
  toggleProjectMilestone: (projectId: string, milestoneId: string) => void;
  // Tasks
  addTask: (input: Omit<MockTask, "id" | "comments">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  addTaskComment: (taskId: string, content: string) => void;
  // Quotations
  addQuotation: (input: {
    title: string;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    items: MockQuoteItem[];
    discountPercent: number;
    taxPercent: number;
    expiryDate: string;
    notes: string;
  }) => void;
  updateQuotationStatus: (id: string, status: MockQuotation["status"]) => void;
  convertQuotationToProject: (id: string) => void;
  convertQuotationToInvoice: (id: string) => void;
  // Invoices
  addInvoice: (input: {
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    description: string;
    amount: number;
    taxPercent: number;
    dueDate: string;
  }) => void;
  updateInvoiceStatus: (id: string, status: MockInvoice["status"]) => void;
  recordInvoicePayment: (id: string, amount: number) => void;
  // Calendar
  addCalendarEvent: (input: Omit<MockCalendarEvent, "id">) => void;
  // Chat
  sendChatMessage: (channelId: string, content: string, attachmentName?: string) => void;
  createChatChannel: (name: string) => string;
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Team
  inviteTeamMember: (name: string, email: string, role: MockTeamMember["role"], jobTitle: string) => void;
  updateTeamMemberRole: (id: string, role: MockTeamMember["role"]) => void;
  // Org
  updateOrgSettings: (patch: Partial<OrgSettings>) => void;
  // Reset
  resetDemoData: () => void;
}

const DemoDataContext = createContext<DemoContextValue | null>(null);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(buildInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DemoState>;
        const base = buildInitialState();
        setState({ ...base, ...parsed });
      }
    } catch {
      // Fallback to default seed data if storage is corrupted
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state, hydrated]);

  const appendAudit = (prev: DemoState, action: string, entityType: string): AuditEntry[] => [
    {
      id: `aud-${Date.now()}`,
      action,
      entityType,
      actorName: "Aarav Kulkarni",
      createdAt: new Date().toISOString(),
    },
    ...prev.auditLogs.slice(0, 24),
  ];

  // Compute live KPIs anchored on the requested baseline so demo edits reflect immediately
  const leadDelta = state.leads.length - mockLeads.length;
  const newLeadsDelta =
    state.leads.filter((l) => l.status === "New").length -
    mockLeads.filter((l) => l.status === "New").length;
  const wonDealsDelta =
    state.deals.filter((d) => d.stage === "Won").length -
    mockDeals.filter((d) => d.stage === "Won").length;
  const lostDealsDelta =
    state.deals.filter((d) => d.stage === "Lost").length -
    mockDeals.filter((d) => d.stage === "Lost").length;
  const activeProjectsDelta =
    state.projects.filter((p) => p.status !== "Completed").length -
    mockProjects.filter((p) => p.status !== "Completed").length;
  const completedProjectsDelta =
    state.projects.filter((p) => p.status === "Completed").length -
    mockProjects.filter((p) => p.status === "Completed").length;
  const pendingTasksDelta =
    state.tasks.filter((t) => t.status !== "Completed").length -
    mockTasks.filter((t) => t.status !== "Completed").length;
  const pendingInvoicesCount = state.invoices.filter((i) => i.status !== "Paid").length;
  const basePaidRevenue = mockInvoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.amountPaid, 0);
  const currentPaidRevenue = state.invoices.reduce((s, i) => s + i.amountPaid, 0);

  const dashboardKpis = {
    totalLeads: Math.max(0, mockDashboardBaseline.totalLeads + leadDelta),
    newLeads: Math.max(0, mockDashboardBaseline.newLeads + newLeadsDelta),
    wonDeals: Math.max(0, mockDashboardBaseline.wonDeals + wonDealsDelta),
    lostDeals: Math.max(0, mockDashboardBaseline.lostDeals + lostDealsDelta),
    monthlyRevenue: Math.max(
      0,
      mockDashboardBaseline.monthlyRevenue + (currentPaidRevenue - basePaidRevenue)
    ),
    activeProjects: Math.max(0, mockDashboardBaseline.activeProjects + activeProjectsDelta),
    completedProjects: Math.max(0, mockDashboardBaseline.completedProjects + completedProjectsDelta),
    pendingTasks: Math.max(0, mockDashboardBaseline.pendingTasks + pendingTasksDelta),
    pendingInvoices: pendingInvoicesCount,
  };

  const addLead: DemoContextValue["addLead"] = useCallback((input) => {
    setState((prev) => {
      const nextNum = 1001 + prev.leads.length;
      const newLead: MockLead = {
        ...input,
        id: `lead-${Date.now()}`,
        leadCode: `LD-${nextNum}`,
        createdDate: new Date().toISOString().slice(0, 10),
      };
      return {
        ...prev,
        leads: [newLead, ...prev.leads],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            category: "Lead",
            title: "New Lead Added",
            message: `${newLead.name} (${newLead.company}) added to CRM.`,
            timeAgo: "Just now",
            read: false,
            href: "/leads",
          },
          ...prev.notifications,
        ],
        auditLogs: appendAudit(prev, `Added lead ${newLead.name} (${newLead.company})`, "Lead"),
      };
    });
  }, []);

  const updateLead: DemoContextValue["updateLead"] = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      auditLogs: appendAudit(prev, `Updated lead ${patch.name || id}`, "Lead"),
    }));
  }, []);

  const deleteLead: DemoContextValue["deleteLead"] = useCallback((id) => {
    setState((prev) => {
      const target = prev.leads.find((l) => l.id === id);
      return {
        ...prev,
        leads: prev.leads.filter((l) => l.id !== id),
        auditLogs: appendAudit(prev, `Deleted lead ${target?.name || id}`, "Lead"),
      };
    });
  }, []);

  const convertLeadToDeal: DemoContextValue["convertLeadToDeal"] = useCallback((id) => {
    setState((prev) => {
      const lead = prev.leads.find((l) => l.id === id);
      if (!lead) return prev;
      const newDeal: MockDeal = {
        id: `deal-${Date.now()}`,
        title: `${lead.company} — Solution Deal`,
        company: lead.company,
        contactName: lead.name,
        contactEmail: lead.email,
        value: lead.estimatedValue || 150000,
        stage: "Qualified",
        probability: 50,
        expectedCloseDate: lead.followUpDate || "2026-12-20",
        assignedTo: lead.assignedTo || "Rohan Verma",
        notes: lead.notes,
      };
      return {
        ...prev,
        leads: prev.leads.map((l) =>
          l.id === id ? { ...l, status: "Converted" as LeadStatus } : l
        ),
        deals: [newDeal, ...prev.deals],
        auditLogs: appendAudit(prev, `Converted lead ${lead.name} to deal`, "Deal"),
      };
    });
  }, []);

  const addDeal: DemoContextValue["addDeal"] = useCallback((input) => {
    setState((prev) => ({
      ...prev,
      deals: [{ ...input, id: `deal-${Date.now()}` }, ...prev.deals],
      auditLogs: appendAudit(prev, `Created deal ${input.title}`, "Deal"),
    }));
  }, []);

  const moveDealStage: DemoContextValue["moveDealStage"] = useCallback((id, stage) => {
    const probMap: Record<DealStage, number> = {
      Discovery: 25,
      Qualified: 50,
      Proposal: 65,
      Negotiation: 80,
      Won: 100,
      Lost: 0,
    };
    setState((prev) => ({
      ...prev,
      deals: prev.deals.map((d) =>
        d.id === id ? { ...d, stage, probability: probMap[stage] } : d
      ),
      auditLogs: appendAudit(prev, `Moved deal to ${stage}`, "Deal"),
    }));
  }, []);

  const addProject: DemoContextValue["addProject"] = useCallback((input) => {
    setState((prev) => {
      const nextCode = `PRJ-${201 + prev.projects.length}`;
      const newProj: MockProject = {
        ...input,
        id: `prj-${Date.now()}`,
        projectCode: nextCode,
        milestones: [],
      };
      return {
        ...prev,
        projects: [newProj, ...prev.projects],
        auditLogs: appendAudit(prev, `Created project ${newProj.name}`, "Project"),
      };
    });
  }, []);

  const updateProjectProgress: DemoContextValue["updateProjectProgress"] = useCallback(
    (id, progress, status) => {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === id
            ? {
                ...p,
                progress,
                status: status ?? (progress === 100 ? "Completed" : p.status),
              }
            : p
        ),
      }));
    },
    []
  );

  const addProjectMilestone: DemoContextValue["addProjectMilestone"] = useCallback(
    (projectId, title) => {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                milestones: [
                  ...p.milestones,
                  {
                    id: `m-${Date.now()}`,
                    title,
                    dueDate: p.deadline,
                    completed: false,
                  },
                ],
              }
            : p
        ),
      }));
    },
    []
  );

  const toggleProjectMilestone: DemoContextValue["toggleProjectMilestone"] = useCallback(
    (projectId, milestoneId) => {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                milestones: p.milestones.map((m) =>
                  m.id === milestoneId ? { ...m, completed: !m.completed } : m
                ),
              }
            : p
        ),
      }));
    },
    []
  );

  const addTask: DemoContextValue["addTask"] = useCallback((input) => {
    setState((prev) => ({
      ...prev,
      tasks: [{ ...input, id: `tsk-${Date.now()}`, comments: [] }, ...prev.tasks],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          category: "Task",
          title: "New Task Assigned",
          message: `'${input.title}' assigned to ${input.assignedTo}.`,
          timeAgo: "Just now",
          read: false,
          href: "/tasks",
        },
        ...prev.notifications,
      ],
      auditLogs: appendAudit(prev, `Created task ${input.title}`, "Task"),
    }));
  }, []);

  const updateTaskStatus: DemoContextValue["updateTaskStatus"] = useCallback((id, status) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  }, []);

  const addTaskComment: DemoContextValue["addTaskComment"] = useCallback((taskId, content) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [
                ...t.comments,
                {
                  id: `c-${Date.now()}`,
                  authorName: "Aarav Kulkarni",
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : t
      ),
    }));
  }, []);

  const addQuotation: DemoContextValue["addQuotation"] = useCallback((input) => {
    setState((prev) => {
      const subtotal = input.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitPrice),
        0
      );
      const total = Math.round(
        subtotal * (1 - input.discountPercent / 100) * (1 + input.taxPercent / 100)
      );
      const quoteNumber = `QT-${1007 + prev.quotations.length + 1}`;
      const newQ: MockQuotation = {
        id: `qt-${Date.now()}`,
        quoteNumber,
        title: input.title,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientCompany: input.clientCompany,
        items: input.items,
        subtotal,
        discountPercent: input.discountPercent,
        taxPercent: input.taxPercent,
        total,
        issueDate: new Date().toISOString().slice(0, 10),
        expiryDate: input.expiryDate || "2026-12-30",
        status: "Sent",
        notes: input.notes,
        shareToken: `demo-${quoteNumber.toLowerCase()}`,
      };
      return {
        ...prev,
        quotations: [newQ, ...prev.quotations],
        auditLogs: appendAudit(prev, `Created quotation ${quoteNumber}`, "Quotation"),
      };
    });
  }, []);

  const updateQuotationStatus: DemoContextValue["updateQuotationStatus"] = useCallback(
    (id, status) => {
      setState((prev) => ({
        ...prev,
        quotations: prev.quotations.map((q) => (q.id === id ? { ...q, status } : q)),
        auditLogs: appendAudit(prev, `Marked quotation ${status}`, "Quotation"),
      }));
    },
    []
  );

  const convertQuotationToProject: DemoContextValue["convertQuotationToProject"] = useCallback(
    (id) => {
      setState((prev) => {
        const q = prev.quotations.find((item) => item.id === id);
        if (!q) return prev;
        const newProj: MockProject = {
          id: `prj-${Date.now()}`,
          projectCode: `PRJ-${201 + prev.projects.length}`,
          name: q.title,
          description: q.notes || `Delivery project converted from ${q.quoteNumber}`,
          client: q.clientCompany || q.clientName,
          clientEmail: q.clientEmail,
          projectManager: "Aditya Rao",
          teamMembers: ["Siddharth Joshi", "Kavya Menon"],
          budget: q.total,
          startDate: new Date().toISOString().slice(0, 10),
          deadline: q.expiryDate || "2026-12-31",
          progress: 10,
          priority: "High",
          status: "Planning",
          milestones: [],
        };
        return {
          ...prev,
          projects: [newProj, ...prev.projects],
          quotations: prev.quotations.map((item) =>
            item.id === id ? { ...item, status: "Approved" } : item
          ),
          auditLogs: appendAudit(prev, `Converted ${q.quoteNumber} to project`, "Project"),
        };
      });
    },
    []
  );

  const convertQuotationToInvoice: DemoContextValue["convertQuotationToInvoice"] = useCallback(
    (id) => {
      setState((prev) => {
        const q = prev.quotations.find((item) => item.id === id);
        if (!q) return prev;
        const invNum = `INV-${1044 + prev.invoices.length - mockInvoices.length}`;
        const newInv: MockInvoice = {
          id: `inv-${Date.now()}`,
          invoiceNumber: invNum,
          clientName: q.clientName,
          clientEmail: q.clientEmail,
          clientCompany: q.clientCompany,
          items: q.items,
          subtotal: q.subtotal,
          discountPercent: q.discountPercent,
          taxPercent: q.taxPercent,
          total: q.total,
          amountPaid: 0,
          status: "Pending",
          issuedAt: new Date().toISOString().slice(0, 10),
          dueDate: q.expiryDate || "2026-12-20",
        };
        return {
          ...prev,
          invoices: [newInv, ...prev.invoices],
          auditLogs: appendAudit(prev, `Converted ${q.quoteNumber} to ${invNum}`, "Invoice"),
        };
      });
    },
    []
  );

  const addInvoice: DemoContextValue["addInvoice"] = useCallback((input) => {
    setState((prev) => {
      const subtotal = Math.round(input.amount);
      const total = Math.round(subtotal * (1 + input.taxPercent / 100));
      const invNum = `INV-${1044 + prev.invoices.length - mockInvoices.length}`;
      const newInv: MockInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: invNum,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientCompany: input.clientCompany,
        items: [{ description: input.description, quantity: 1, unitPrice: subtotal }],
        subtotal,
        discountPercent: 0,
        taxPercent: input.taxPercent,
        total,
        amountPaid: 0,
        status: "Pending",
        issuedAt: new Date().toISOString().slice(0, 10),
        dueDate: input.dueDate || "2026-12-15",
      };
      return {
        ...prev,
        invoices: [newInv, ...prev.invoices],
        auditLogs: appendAudit(prev, `Issued invoice ${invNum}`, "Invoice"),
      };
    });
  }, []);

  const updateInvoiceStatus: DemoContextValue["updateInvoiceStatus"] = useCallback(
    (id, status) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) => {
          if (inv.id !== id) return inv;
          return {
            ...inv,
            status,
            amountPaid:
              status === "Paid"
                ? inv.total
                : status === "Pending" || status === "Overdue"
                ? 0
                : inv.amountPaid,
          };
        }),
        auditLogs: appendAudit(prev, `Changed invoice status to ${status}`, "Invoice"),
      }));
    },
    []
  );

  const recordInvoicePayment: DemoContextValue["recordInvoicePayment"] = useCallback(
    (id, amount) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) => {
          if (inv.id !== id) return inv;
          const nextPaid = Math.min(inv.total, inv.amountPaid + amount);
          const nextStatus: MockInvoice["status"] =
            nextPaid >= inv.total ? "Paid" : nextPaid > 0 ? "Partial" : inv.status;
          return { ...inv, amountPaid: nextPaid, status: nextStatus };
        }),
        auditLogs: appendAudit(prev, `Recorded payment of ₹${amount.toLocaleString("en-IN")}`, "Invoice"),
      }));
    },
    []
  );

  const addCalendarEvent: DemoContextValue["addCalendarEvent"] = useCallback((input) => {
    setState((prev) => ({
      ...prev,
      calendarEvents: [{ ...input, id: `evt-${Date.now()}` }, ...prev.calendarEvents],
    }));
  }, []);

  const sendChatMessage: DemoContextValue["sendChatMessage"] = useCallback(
    (channelId, content, attachmentName) => {
      setState((prev) => ({
        ...prev,
        chatMessages: [
          ...prev.chatMessages,
          {
            id: `msg-${Date.now()}`,
            channelId,
            senderName: "Aarav Kulkarni",
            senderRole: "Admin",
            content,
            attachmentName: attachmentName || undefined,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    []
  );

  const createChatChannel: DemoContextValue["createChatChannel"] = useCallback((name) => {
    const id = `ch-${Date.now()}`;
    const clean = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setState((prev) => ({
      ...prev,
      chatChannels: [...prev.chatChannels, { id, name: clean, type: "channel" }],
    }));
    return id;
  }, []);

  const markNotificationRead: DemoContextValue["markNotificationRead"] = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead: DemoContextValue["markAllNotificationsRead"] = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const inviteTeamMember: DemoContextValue["inviteTeamMember"] = useCallback(
    (name, email, role, jobTitle) => {
      setState((prev) => ({
        ...prev,
        teamMembers: [
          ...prev.teamMembers,
          {
            id: `usr-${Date.now()}`,
            name,
            initials: getInitials(name),
            email,
            jobTitle,
            department: "Operations",
            role,
            status: "Active",
            avatarColor: "bg-[#1d6bff]",
          },
        ],
        auditLogs: appendAudit(prev, `Added team member ${name} (${role})`, "Team"),
      }));
    },
    []
  );

  const updateTeamMemberRole: DemoContextValue["updateTeamMemberRole"] = useCallback(
    (id, role) => {
      setState((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.map((m) => (m.id === id ? { ...m, role } : m)),
      }));
    },
    []
  );

  const updateOrgSettings: DemoContextValue["updateOrgSettings"] = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      orgSettings: { ...prev.orgSettings, ...patch },
      auditLogs: appendAudit(prev, "Updated organisation settings", "Settings"),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = buildInitialState();
    setState(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  }, []);

  return (
    <DemoDataContext.Provider
      value={{
        state,
        hydrated,
        dashboardKpis,
        addLead,
        updateLead,
        deleteLead,
        convertLeadToDeal,
        addDeal,
        moveDealStage,
        addProject,
        updateProjectProgress,
        addProjectMilestone,
        toggleProjectMilestone,
        addTask,
        updateTaskStatus,
        addTaskComment,
        addQuotation,
        updateQuotationStatus,
        convertQuotationToProject,
        convertQuotationToInvoice,
        addInvoice,
        updateInvoiceStatus,
        recordInvoicePayment,
        addCalendarEvent,
        sendChatMessage,
        createChatChannel,
        markNotificationRead,
        markAllNotificationsRead,
        inviteTeamMember,
        updateTeamMemberRole,
        updateOrgSettings,
        resetDemoData,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) {
    throw new Error("useDemoData must be used inside DemoDataProvider");
  }
  return ctx;
}
