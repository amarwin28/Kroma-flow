import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organisationName: z.string().min(2, "Organisation name is required").optional(),
  inviteToken: z.string().optional(),
});

export const leadSchema = z.object({
  name: z.string().min(2, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
  source: z.string().optional().default("Website"),
  status: z.enum(["New", "Contacted", "Qualified", "Converted", "Lost"]).default("New"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  ownerId: z.string().optional().nullable(),
  followUpDate: z.string().optional().default(""),
  estimatedValue: z.coerce.number().min(0).default(0),
  notes: z.string().optional().default(""),
});

export const dealSchema = z.object({
  title: z.string().min(2, "Deal title is required"),
  company: z.string().optional().default(""),
  contactName: z.string().optional().default(""),
  contactEmail: z.string().email("Valid email").or(z.literal("")).default(""),
  value: z.coerce.number().min(0).default(0),
  stage: z.enum(["Discovery", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]).default("Discovery"),
  probability: z.coerce.number().min(0).max(100).default(25),
  expectedCloseDate: z.string().optional().default(""),
  ownerId: z.string().optional().nullable(),
  notes: z.string().optional().default(""),
});

export const lineItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const quotationSchema = z.object({
  title: z.string().min(2, "Quotation title is required"),
  dealId: z.string().optional().nullable(),
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  clientCompany: z.string().optional().default(""),
  items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  validUntil: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  description: z.string().optional().default(""),
  clientName: z.string().optional().default(""),
  clientEmail: z.string().email().or(z.literal("")).default(""),
  status: z.enum(["Planning", "In Progress", "On Hold", "Completed"]).default("Planning"),
  progress: z.coerce.number().min(0).max(100).default(0),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  managerId: z.string().optional().nullable(),
  budget: z.coerce.number().min(0).default(0),
});

export const taskSchema = z.object({
  projectId: z.string().optional().nullable(),
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional().default(""),
  assigneeId: z.string().optional().nullable(),
  status: z.enum(["Todo", "In Progress", "Review", "Done"]).default("Todo"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  dueDate: z.string().optional().default(""),
  subtasks: z
    .array(z.object({ id: z.string(), title: z.string(), done: z.boolean() }))
    .optional()
    .default([]),
});

export const invoiceSchema = z.object({
  projectId: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(),
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  clientCompany: z.string().optional().default(""),
  items: z.array(lineItemSchema).min(1, "At least one item is required"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  dueDate: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export function computeTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  discountPercent: number,
  taxPercent: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const afterDiscount = subtotal * (1 - discountPercent / 100);
  const total = Math.round((afterDiscount * (1 + taxPercent / 100)) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, total };
}
