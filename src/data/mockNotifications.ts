// DEMO DATA ONLY — Sample notifications, team chat channels/messages, and simulated AI suggestions.

export interface MockNotification {
  id: string;
  category: "Lead" | "Task" | "Project" | "Quotation" | "Invoice" | "Deadline";
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  href: string;
}

export interface MockChatChannel {
  id: string;
  name: string;
  type: "channel" | "project";
}

export interface MockChatMessage {
  id: string;
  channelId: string;
  senderName: string;
  senderRole: string;
  content: string;
  attachmentName?: string;
  createdAt: string;
}

export interface MockAiSuggestion {
  id: string;
  category: string;
  title: string;
  summary: string;
  actionLabel: string;
  href: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: "notif-1",
    category: "Lead",
    title: "New High-Priority Lead Assigned",
    message: "Aishwarya Iyer (Pulse EdTech · ₹1,65,000) assigned to Rohan Verma.",
    timeAgo: "12 mins ago",
    read: false,
    href: "/leads",
  },
  {
    id: "notif-2",
    category: "Invoice",
    title: "Invoice Payment Received",
    message: "TechCorp Solutions paid ₹1,20,000 for INV-1043 via NEFT.",
    timeAgo: "1 hour ago",
    read: false,
    href: "/invoices",
  },
  {
    id: "notif-3",
    category: "Quotation",
    title: "Quotation Approved by Client",
    message: "Digital Edge approved QT-1014 (45-Seat CRM Implementation).",
    timeAgo: "3 hours ago",
    read: false,
    href: "/quotations",
  },
  {
    id: "notif-4",
    category: "Task",
    title: "New Task Assignment",
    message: "Aditya Rao assigned 'Verify Razorpay webhook signature' to Siddharth Joshi.",
    timeAgo: "5 hours ago",
    read: false,
    href: "/tasks",
  },
  {
    id: "notif-5",
    category: "Project",
    title: "Project Milestone Completed",
    message: "E-commerce Platform (Innovate Labs) reached 92% completion.",
    timeAgo: "Yesterday",
    read: true,
    href: "/projects",
  },
  {
    id: "notif-6",
    category: "Deadline",
    title: "Upcoming Deadline Alert",
    message: "INV-1042 (Growth Media · ₹85,000) is due on 28 Nov 2026.",
    timeAgo: "Yesterday",
    read: true,
    href: "/calendar",
  },
];

export const mockChatChannels: MockChatChannel[] = [
  { id: "ch-general", name: "general", type: "channel" },
  { id: "ch-sales", name: "sales-pipeline", type: "channel" },
  { id: "ch-techcorp", name: "techcorp-redesign", type: "project" },
  { id: "ch-innovate", name: "innovate-ecommerce", type: "project" },
  { id: "ch-finance", name: "finance-gst", type: "channel" },
];

export const mockChatMessages: MockChatMessage[] = [
  {
    id: "msg-1",
    channelId: "ch-general",
    senderName: "Aarav Kulkarni",
    senderRole: "Admin",
    content: "Good afternoon team! Great momentum this week — Innovate Labs storefront is at 92% and TechCorp UAT is tomorrow.",
    createdAt: "2026-11-25T10:15:00",
  },
  {
    id: "msg-2",
    channelId: "ch-general",
    senderName: "Ananya Deshmukh",
    senderRole: "Manager",
    content: "Reminder: Please update your task statuses before 5 PM so the Friday delivery report stays accurate.",
    createdAt: "2026-11-25T11:05:00",
  },
  {
    id: "msg-3",
    channelId: "ch-sales",
    senderName: "Meera Krishnan",
    senderRole: "Sales Executive",
    content: "Rahul Mehta (Growth Media) reviewed the Q4 Brand Campaign SLA. Expecting final sign-off by Friday.",
    createdAt: "2026-11-25T11:40:00",
  },
  {
    id: "msg-4",
    channelId: "ch-sales",
    senderName: "Rohan Verma",
    senderRole: "Sales Executive",
    content: "Arjun Nair from Digital Edge confirmed 45 seats for CRM Implementation. Moving deal to Qualified → Proposal.",
    attachmentName: "DigitalEdge_Scope_v2.pdf",
    createdAt: "2026-11-25T12:20:00",
  },
  {
    id: "msg-5",
    channelId: "ch-techcorp",
    senderName: "Kavya Menon",
    senderRole: "Designer",
    content: "Uploaded the final responsive header & mobile drawer specs for TechCorp Solutions.",
    attachmentName: "TechCorp_UI_Kit_v4.fig",
    createdAt: "2026-11-25T13:10:00",
  },
  {
    id: "msg-6",
    channelId: "ch-techcorp",
    senderName: "Siddharth Joshi",
    senderRole: "Developer",
    content: "Headless CMS migration is in Review. Ready for Aditya's QA pass before tomorrow's UAT.",
    createdAt: "2026-11-25T13:45:00",
  },
  {
    id: "msg-7",
    channelId: "ch-innovate",
    senderName: "Neha Kapoor",
    senderRole: "Project Manager",
    content: "Razorpay webhook & GST invoice trigger are in final testing for Innovate Labs.",
    createdAt: "2026-11-25T14:05:00",
  },
  {
    id: "msg-8",
    channelId: "ch-finance",
    senderName: "Pooja Bansal",
    senderRole: "Accountant",
    content: "Confirmed receipt of ₹1,20,000 for INV-1043 (TechCorp Solutions). Marked as Paid!",
    createdAt: "2026-11-25T14:25:00",
  },
];

export const mockAiSuggestions: MockAiSuggestion[] = [
  {
    id: "ai-1",
    category: "CRM Follow-up",
    title: "Follow up with 5 Qualified leads",
    summary: "Arjun Nair (Digital Edge), Divya Menon (Horizon FinTech), and Vivek Oberoi (Vertex Retail) have high deal values (₹8,10,000 combined) with follow-ups due this week.",
    actionLabel: "Open Qualified Leads",
    href: "/leads",
  },
  {
    id: "ai-2",
    category: "Quotations",
    title: "Remind clients on 5 pending quotations",
    summary: "QT-1017 (NextGen Technologies), QT-1016 (Growth Media), and QT-1015 (Nimbus Healthcare) are awaiting approval.",
    actionLabel: "Review Quotations",
    href: "/quotations",
  },
  {
    id: "ai-3",
    category: "Task Health",
    title: "Identify overdue & due-today tasks",
    summary: "3 high-priority tasks including 'NextGen biometric login' and 'Growth Media A/B test' need immediate review.",
    actionLabel: "View Pending Tasks",
    href: "/tasks",
  },
  {
    id: "ai-4",
    category: "Sales Opportunity",
    title: "Prioritise 3 Negotiation-stage deals",
    summary: "Growth Media (₹2,40,000), Horizon FinTech (₹3,15,000), and Aura Realty (₹2,10,000) are at 80% probability — ₹7,65,000 near-term close potential.",
    actionLabel: "Open Deals Pipeline",
    href: "/deals",
  },
  {
    id: "ai-5",
    category: "Project Summary",
    title: "Project delivery pulse: 48 active, 32 completed",
    summary: "E-commerce Platform (92%) and Brand Campaign (85%) are on track for completion within 10 days.",
    actionLabel: "Inspect Projects",
    href: "/projects",
  },
];
