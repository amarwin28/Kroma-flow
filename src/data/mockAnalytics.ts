// DEMO DATA ONLY — Consistent Dashboard & Analytics series for KROMAXZON TECHNOLOGIES.

export const mockDashboardBaseline = {
  totalLeads: 1248,
  newLeads: 186,
  wonDeals: 326,
  lostDeals: 42,
  monthlyRevenue: 845230,
  activeProjects: 48,
  completedProjects: 32,
  pendingTasks: 24,
  pendingInvoices: 12,
};

export const mockAnalytics = {
  monthlyRevenueSeries: [
    { month: "Jun", revenue: 540000, target: 520000 },
    { month: "Jul", revenue: 615000, target: 580000 },
    { month: "Aug", revenue: 685000, target: 650000 },
    { month: "Sep", revenue: 730000, target: 700000 },
    { month: "Oct", revenue: 792000, target: 760000 },
    { month: "Nov", revenue: 845230, target: 820000 },
  ],
  leadConversionFunnel: [
    { stage: "Total Leads", count: 1248, pct: 100 },
    { stage: "Contacted", count: 890, pct: 71 },
    { stage: "Qualified", count: 540, pct: 43 },
    { stage: "Proposal Sent", count: 410, pct: 33 },
    { stage: "Converted / Won", count: 326, pct: 26 },
  ],
  projectCompletionSeries: [
    { month: "Jun", completed: 4, active: 38 },
    { month: "Jul", completed: 5, active: 41 },
    { month: "Aug", completed: 6, active: 43 },
    { month: "Sep", completed: 5, active: 45 },
    { month: "Oct", completed: 6, active: 46 },
    { month: "Nov", completed: 6, active: 48 },
  ],
  monthlyBusinessGrowth: [
    { month: "Jun", growthPct: 8.4 },
    { month: "Jul", growthPct: 13.8 },
    { month: "Aug", growthPct: 11.4 },
    { month: "Sep", growthPct: 6.6 },
    { month: "Oct", growthPct: 8.5 },
    { month: "Nov", growthPct: 14.2 },
  ],
  leadSourceDistribution: [
    { source: "Website", count: 412 },
    { source: "LinkedIn", count: 298 },
    { source: "Referral", count: 224 },
    { source: "Inbound Demo", count: 168 },
    { source: "Google Ads", count: 94 },
    { source: "Partner / Events", count: 52 },
  ],
  teamProductivity: [
    { name: "Siddharth Joshi", completed: 18, active: 6 },
    { name: "Kavya Menon", completed: 15, active: 5 },
    { name: "Karthik Subramanian", completed: 14, active: 4 },
    { name: "Aditya Rao", completed: 12, active: 4 },
    { name: "Neha Kapoor", completed: 11, active: 3 },
    { name: "Rohan Verma", completed: 10, active: 2 },
  ],
  invoiceCollectionSummary: {
    billed: 1353000,
    collected: 519000,
    pending: 770000,
    overdue: 64000,
  },
};
