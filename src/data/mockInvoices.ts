// DEMO DATA ONLY — 16 sample invoices in Indian Rupees (INR).
// Includes INV-1043, INV-1042, INV-1041 and 12 pending/unpaid invoices matching dashboard KPIs.

export interface MockInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface MockInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  items: MockInvoiceItem[];
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
  amountPaid: number;
  status: "Paid" | "Pending" | "Partial" | "Overdue";
  issuedAt: string;
  dueDate: string;
}

function makeInvoice(
  id: string,
  invoiceNumber: string,
  clientName: string,
  clientEmail: string,
  clientCompany: string,
  description: string,
  total: number,
  amountPaid: number,
  status: MockInvoice["status"],
  issuedAt: string,
  dueDate: string
): MockInvoice {
  const taxPercent = 18;
  const subtotal = Math.round(total / 1.18);
  return {
    id,
    invoiceNumber,
    clientName,
    clientEmail,
    clientCompany,
    items: [{ description, quantity: 1, unitPrice: subtotal }],
    subtotal,
    discountPercent: 0,
    taxPercent,
    total,
    amountPaid,
    status,
    issuedAt,
    dueDate,
  };
}

export const mockInvoices: MockInvoice[] = [
  makeInvoice(
    "inv-1",
    "INV-1043",
    "Priya Sharma",
    "priya.sharma@techcorpsolutions.in",
    "TechCorp Solutions",
    "Website Redesign — Milestone 2 Delivery",
    120000,
    120000,
    "Paid",
    "2026-11-01",
    "2026-11-15"
  ),
  makeInvoice(
    "inv-2",
    "INV-1042",
    "Rahul Mehta",
    "rahul.mehta@growthmedia.in",
    "Growth Media",
    "Q4 Brand Campaign — Creative & Funnel Retainer",
    85000,
    0,
    "Pending",
    "2026-11-10",
    "2026-11-28"
  ),
  makeInvoice(
    "inv-3",
    "INV-1041",
    "Sneha Iyer",
    "sneha.iyer@innovatelabs.io",
    "Innovate Labs",
    "E-commerce Platform — Payment & GST Integration",
    115000,
    115000,
    "Paid",
    "2026-10-28",
    "2026-11-12"
  ),
  makeInvoice(
    "inv-4",
    "INV-1040",
    "Vikram Singh",
    "vikram.singh@nextgentech.in",
    "NextGen Technologies",
    "Mobile App Development — Sprint 2",
    95000,
    0,
    "Pending",
    "2026-11-12",
    "2026-11-30"
  ),
  makeInvoice(
    "inv-5",
    "INV-1039",
    "Arjun Nair",
    "arjun.nair@digitaledge.co.in",
    "Digital Edge",
    "CRM Implementation — Data Migration Phase",
    72000,
    0,
    "Pending",
    "2026-11-08",
    "2026-11-26"
  ),
  makeInvoice(
    "inv-6",
    "INV-1038",
    "Divya Menon",
    "divya.menon@horizonfintech.in",
    "Horizon FinTech",
    "Client Portal & Compliance Suite — Final Sign-off",
    110000,
    110000,
    "Paid",
    "2026-11-02",
    "2026-11-16"
  ),
  makeInvoice(
    "inv-7",
    "INV-1037",
    "Suresh Reddy",
    "suresh.reddy@apexlogistics.in",
    "Apex Logistics",
    "Fleet Dispatch Portal — Advance",
    68000,
    0,
    "Pending",
    "2026-11-14",
    "2026-12-02"
  ),
  makeInvoice(
    "inv-8",
    "INV-1036",
    "Nandini Patel",
    "nandini.patel@vertexretail.in",
    "Vertex Retail",
    "Omnichannel POS Integration — Kickoff",
    55000,
    0,
    "Pending",
    "2026-11-15",
    "2026-12-04"
  ),
  makeInvoice(
    "inv-9",
    "INV-1035",
    "Dr. Rajeshwar Rao",
    "rajeshwar@nimbushealth.in",
    "Nimbus Healthcare",
    "Telehealth Patient Portal — Milestone 1",
    88000,
    44000,
    "Partial",
    "2026-11-04",
    "2026-11-25"
  ),
  makeInvoice(
    "inv-10",
    "INV-1034",
    "Shreya Chatterjee",
    "shreya@pulseedtech.in",
    "Pulse EdTech",
    "LMS & Fee Automation — Onboarding",
    48000,
    0,
    "Pending",
    "2026-11-16",
    "2026-12-05"
  ),
  makeInvoice(
    "inv-11",
    "INV-1033",
    "Karan Malhotra",
    "karan@aurarealty.in",
    "Aura Realty",
    "Broker Lead Routing Engine — Phase 1",
    64000,
    0,
    "Overdue",
    "2026-10-25",
    "2026-11-18"
  ),
  makeInvoice(
    "inv-12",
    "INV-1032",
    "Prakash Kulkarni",
    "prakash@zenithmfg.in",
    "Zenith Manufacturing",
    "Industrial IoT Ops Dashboard — Final Delivery",
    130000,
    130000,
    "Paid",
    "2026-11-05",
    "2026-11-19"
  ),
  makeInvoice(
    "inv-13",
    "INV-1031",
    "Tanvi Deshpande",
    "tanvi@solarisenergy.in",
    "Solaris Energy",
    "Field Service Mobile App — Sprint 1",
    58000,
    0,
    "Pending",
    "2026-11-18",
    "2026-12-06"
  ),
  makeInvoice(
    "inv-14",
    "INV-1030",
    "Ishaan Gupta",
    "ishaan@quantumanalytics.in",
    "Quantum Analytics",
    "Executive BI & Data Warehouse — Milestone 1",
    92000,
    0,
    "Pending",
    "2026-11-19",
    "2026-12-08"
  ),
  makeInvoice(
    "inv-15",
    "INV-1029",
    "Priya Sharma",
    "priya.sharma@techcorpsolutions.in",
    "TechCorp Solutions",
    "SaaS Billing & GST Portal — Support Retainer",
    45000,
    0,
    "Pending",
    "2026-11-20",
    "2026-12-10"
  ),
  makeInvoice(
    "inv-16",
    "INV-1028",
    "Sneha Iyer",
    "sneha.iyer@innovatelabs.io",
    "Innovate Labs",
    "AI Support Triage Assistant — Discovery",
    54000,
    0,
    "Pending",
    "2026-11-21",
    "2026-12-12"
  ),
];
