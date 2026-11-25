// DEMO DATA ONLY — 12 sample quotations connected to valid clients.

export interface MockQuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface MockQuotation {
  id: string;
  quoteNumber: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  items: MockQuoteItem[];
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
  issueDate: string;
  expiryDate: string;
  status: "Draft" | "Sent" | "Approved" | "Rejected";
  notes: string;
  shareToken: string;
}

function calcTotal(items: MockQuoteItem[], discountPercent: number, taxPercent: number) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const afterDiscount = subtotal * (1 - discountPercent / 100);
  const total = Math.round(afterDiscount * (1 + taxPercent / 100));
  return { subtotal, total };
}

function makeQuote(
  id: string,
  quoteNumber: string,
  title: string,
  clientName: string,
  clientEmail: string,
  clientCompany: string,
  items: MockQuoteItem[],
  discountPercent: number,
  taxPercent: number,
  issueDate: string,
  expiryDate: string,
  status: MockQuotation["status"],
  notes: string
): MockQuotation {
  const { subtotal, total } = calcTotal(items, discountPercent, taxPercent);
  return {
    id,
    quoteNumber,
    title,
    clientName,
    clientEmail,
    clientCompany,
    items,
    subtotal,
    discountPercent,
    taxPercent,
    total,
    issueDate,
    expiryDate,
    status,
    notes,
    shareToken: `demo-${quoteNumber.toLowerCase()}`,
  };
}

export const mockQuotations: MockQuotation[] = [
  makeQuote(
    "qt-1",
    "QT-1018",
    "Enterprise Website Redesign & CMS",
    "Priya Sharma",
    "priya.sharma@techcorpsolutions.in",
    "TechCorp Solutions",
    [
      { description: "UI/UX Design System & Prototyping", quantity: 1, unitPrice: 120000 },
      { description: "Next.js Frontend & Headless CMS", quantity: 1, unitPrice: 180000 },
    ],
    5,
    18,
    "2026-10-15",
    "2026-11-15",
    "Approved",
    "Includes 60 days post-launch hypercare."
  ),
  makeQuote(
    "qt-2",
    "QT-1017",
    "Cross-Platform Mobile App Development",
    "Vikram Singh",
    "vikram.singh@nextgentech.in",
    "NextGen Technologies",
    [
      { description: "iOS & Android React Native App", quantity: 1, unitPrice: 260000 },
      { description: "Biometric Auth & API Gateway", quantity: 1, unitPrice: 80000 },
    ],
    5,
    18,
    "2026-11-08",
    "2026-12-08",
    "Sent",
    "Milestone billing: 40% advance, 30% beta, 30% launch."
  ),
  makeQuote(
    "qt-3",
    "QT-1016",
    "Q4 Omnichannel Brand Campaign",
    "Rahul Mehta",
    "rahul.mehta@growthmedia.in",
    "Growth Media",
    [
      { description: "Campaign Strategy & Creative Suite", quantity: 1, unitPrice: 110000 },
      { description: "Landing Pages & Funnel Analytics", quantity: 2, unitPrice: 45000 },
    ],
    0,
    18,
    "2026-11-10",
    "2026-12-10",
    "Sent",
    "Awaiting final sign-off from marketing head."
  ),
  makeQuote(
    "qt-4",
    "QT-1015",
    "Telehealth Patient Portal",
    "Dr. Rajeshwar Rao",
    "rajeshwar@nimbushealth.in",
    "Nimbus Healthcare",
    [
      { description: "Appointment & Video Consultation Module", quantity: 1, unitPrice: 165000 },
      { description: "E-Prescription & Lab Vault", quantity: 1, unitPrice: 75000 },
    ],
    4,
    18,
    "2026-11-12",
    "2026-12-12",
    "Sent",
    "DISHA-compliant audit logging included."
  ),
  makeQuote(
    "qt-5",
    "QT-1014",
    "45-Seat CRM Implementation",
    "Arjun Nair",
    "arjun.nair@digitaledge.co.in",
    "Digital Edge",
    [
      { description: "CRM Configuration & Custom Pipelines", quantity: 1, unitPrice: 150000 },
      { description: "Data Migration & Team Training", quantity: 45, unitPrice: 2000 },
    ],
    0,
    18,
    "2026-11-02",
    "2026-12-02",
    "Approved",
    "Kickoff completed."
  ),
  makeQuote(
    "qt-6",
    "QT-1013",
    "Headless E-commerce Platform",
    "Sneha Iyer",
    "sneha.iyer@innovatelabs.io",
    "Innovate Labs",
    [
      { description: "Storefront, Cart & Checkout Engine", quantity: 1, unitPrice: 280000 },
      { description: "GST Invoicing & Razorpay Sync", quantity: 1, unitPrice: 90000 },
    ],
    5,
    18,
    "2026-10-05",
    "2026-11-05",
    "Approved",
    "Converted to active project PRJ-204."
  ),
  makeQuote(
    "qt-7",
    "QT-1012",
    "Executive BI & Data Warehouse",
    "Ishaan Gupta",
    "ishaan@quantumanalytics.in",
    "Quantum Analytics",
    [
      { description: "ETL Pipeline & Star Schema Design", quantity: 1, unitPrice: 175000 },
      { description: "Executive KPI Dashboard", quantity: 1, unitPrice: 95000 },
    ],
    0,
    18,
    "2026-11-14",
    "2026-12-14",
    "Sent",
    "Includes Snowflake/BigQuery connector."
  ),
  makeQuote(
    "qt-8",
    "QT-1011",
    "Broker Lead Routing Engine",
    "Karan Malhotra",
    "karan@aurarealty.in",
    "Aura Realty",
    [
      { description: "Geo-fenced Lead Router & WhatsApp API", quantity: 1, unitPrice: 185000 },
    ],
    5,
    18,
    "2026-11-15",
    "2026-12-05",
    "Sent",
    "5% annual commitment discount applied."
  ),
  makeQuote(
    "qt-9",
    "QT-1010",
    "Field Service Offline Mobile App",
    "Tanvi Deshpande",
    "tanvi@solarisenergy.in",
    "Solaris Energy",
    [
      { description: "Offline Inspection App & Sync Engine", quantity: 1, unitPrice: 165000 },
    ],
    0,
    18,
    "2026-10-28",
    "2026-11-28",
    "Approved",
    "Approved for Phase 1."
  ),
  makeQuote(
    "qt-10",
    "QT-1009",
    "Omnichannel POS Integration",
    "Nandini Patel",
    "nandini.patel@vertexretail.in",
    "Vertex Retail",
    [
      { description: "POS Sync Connector (12 Outlets)", quantity: 12, unitPrice: 14000 },
    ],
    0,
    18,
    "2026-11-18",
    "2026-12-18",
    "Draft",
    "Pending final store count confirmation."
  ),
  makeQuote(
    "qt-11",
    "QT-1008",
    "Industrial IoT Ops Dashboard",
    "Prakash Kulkarni",
    "prakash@zenithmfg.in",
    "Zenith Manufacturing",
    [
      { description: "Telemetry Ingestion & OEE Alerts", quantity: 1, unitPrice: 220000 },
    ],
    0,
    18,
    "2026-09-25",
    "2026-10-25",
    "Approved",
    "Completed and delivered."
  ),
  makeQuote(
    "qt-12",
    "QT-1007",
    "D2C Storefront Revamp",
    "Harish Agarwal",
    "harish@metrofoods.in",
    "Metro Foods",
    [
      { description: "D2C Theme & Subscription Engine", quantity: 1, unitPrice: 85000 },
    ],
    0,
    18,
    "2026-10-10",
    "2026-11-10",
    "Rejected",
    "Client deferred project to Q1 2027."
  ),
];
