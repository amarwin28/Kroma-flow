import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getEnv } from "./env";

let dbInstance: DatabaseSync | null = null;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const { databasePath } = getEnv();
  const dir = path.dirname(databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  initSchema(db);
  seedIfEmpty(db);

  dbInstance = db;
  return db;
}

export function resetDbForTests(customPath?: string) {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
  if (customPath) {
    process.env.DATABASE_PATH = customPath;
  }
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT DEFAULT '/brand/kromaxzon-logo.svg',
      primary_color TEXT DEFAULT '#1D6BFF',
      industry TEXT DEFAULT 'Technology & Services',
      website TEXT DEFAULT '',
      address TEXT DEFAULT '',
      tax_id TEXT DEFAULT '',
      plan TEXT DEFAULT 'Enterprise',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      job_title TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      email_verified INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      token TEXT NOT NULL UNIQUE,
      invited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      company TEXT DEFAULT '',
      source TEXT DEFAULT 'Website',
      status TEXT NOT NULL DEFAULT 'New',
      priority TEXT NOT NULL DEFAULT 'Medium',
      owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      follow_up_date TEXT DEFAULT '',
      estimated_value REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      company TEXT DEFAULT '',
      contact_name TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      value REAL NOT NULL DEFAULT 0,
      stage TEXT NOT NULL DEFAULT 'Discovery',
      probability INTEGER NOT NULL DEFAULT 25,
      expected_close_date TEXT DEFAULT '',
      owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      deal_id TEXT REFERENCES deals(id) ON DELETE SET NULL,
      quote_number TEXT NOT NULL,
      title TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_company TEXT DEFAULT '',
      items_json TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0,
      discount_percent REAL NOT NULL DEFAULT 0,
      tax_percent REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Draft',
      valid_until TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      share_token TEXT NOT NULL UNIQUE,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      quotation_id TEXT REFERENCES quotations(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      client_name TEXT DEFAULT '',
      client_email TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Planning',
      progress INTEGER NOT NULL DEFAULT 0,
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      budget REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_milestones (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      due_date TEXT DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'Contributor'
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'Todo',
      priority TEXT NOT NULL DEFAULT 'Medium',
      due_date TEXT DEFAULT '',
      subtasks_json TEXT NOT NULL DEFAULT '[]',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'team',
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      attachment_url TEXT DEFAULT '',
      attachment_name TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'Meeting',
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      attendees_json TEXT NOT NULL DEFAULT '[]',
      location TEXT DEFAULT '',
      reminder_minutes INTEGER DEFAULT 15,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      quotation_id TEXT REFERENCES quotations(id) ON DELETE SET NULL,
      invoice_number TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_company TEXT DEFAULT '',
      items_json TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0,
      discount_percent REAL NOT NULL DEFAULT 0,
      tax_percent REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Unpaid',
      due_date TEXT DEFAULT '',
      issued_at TEXT NOT NULL,
      notes TEXT DEFAULT '',
      share_token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      method TEXT NOT NULL DEFAULT 'Bank Transfer',
      reference TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      confirmed_by_provider INTEGER NOT NULL DEFAULT 1,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      folder TEXT NOT NULL DEFAULT 'General',
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'text/plain',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      content_text TEXT DEFAULT '',
      storage_path TEXT DEFAULT '',
      is_template INTEGER NOT NULL DEFAULT 0,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      shared_with_client INTEGER NOT NULL DEFAULT 0,
      uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS client_feedback (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      client_email TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      trigger_type TEXT NOT NULL,
      conditions_json TEXT NOT NULL DEFAULT '[]',
      actions_json TEXT NOT NULL DEFAULT '[]',
      enabled INTEGER NOT NULL DEFAULT 1,
      run_count INTEGER NOT NULL DEFAULT 0,
      last_run_at TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      trigger_payload_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'Success',
      log_text TEXT DEFAULT '',
      executed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT DEFAULT '',
      details_json TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT DEFAULT '/dashboard',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS org_settings (
      org_id TEXT PRIMARY KEY REFERENCES organisations(id) ON DELETE CASCADE,
      notification_prefs_json TEXT NOT NULL DEFAULT '{"emailAlerts":true,"dealUpdates":true,"invoiceReminders":true}',
      security_prefs_json TEXT NOT NULL DEFAULT '{"mfaRecommended":true,"sessionTimeoutHours":72,"requireStrongPasswords":true}',
      integrations_json TEXT NOT NULL DEFAULT '{"stripe":{"connected":false},"googleCalendar":{"connected":false},"slack":{"connected":false},"openai":{"connected":false}}',
      billing_plan TEXT NOT NULL DEFAULT 'Enterprise',
      updated_at TEXT NOT NULL
    );
  `);
}

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as count FROM organisations").get() as { count: number };
  if (row.count > 0) return;

  const now = new Date().toISOString();
  const orgId = "org_kromaxzon_demo";
  const ownerId = "usr_owner_1";
  const salesId = "usr_sales_2";
  const pmId = "usr_pm_3";
  const clientUserId = "usr_client_4";

  db.prepare(
    `INSERT INTO organisations (id, name, slug, logo_url, primary_color, industry, website, address, tax_id, plan, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    orgId,
    "KROMAXZON TECHNOLOGIES",
    "kromaxzon-demo",
    "/brand/kromaxzon-logo.svg",
    "#1D6BFF",
    "Enterprise Software & Consulting",
    "https://kromaxzon.com",
    "100 Innovation Way, Tech Park",
    "TAX-KMX-90210",
    "Enterprise",
    now
  );

  db.prepare(
    `INSERT INTO org_settings (org_id, updated_at) VALUES (?, ?)`
  ).run(orgId, now);

  const demoPass = hashPassword("KromaFlow@2026");

  const insertUser = db.prepare(
    `INSERT INTO users (id, org_id, email, name, password_hash, role, job_title, phone, email_verified, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?)`
  );
  insertUser.run(ownerId, orgId, "alex@kromaxzon.com", "Alex Mercer", demoPass, "owner", "Chief Operating Officer", "+1 555-0101", now);
  insertUser.run(salesId, orgId, "priya@kromaxzon.com", "Priya Nair", demoPass, "sales", "Enterprise Account Executive", "+1 555-0102", now);
  insertUser.run(pmId, orgId, "marcus@kromaxzon.com", "Marcus Vance", demoPass, "manager", "Lead Project Manager", "+1 555-0103", now);
  insertUser.run(clientUserId, orgId, "client@apexretail.com", "Elena Rostova", demoPass, "client", "VP of Digital, Apex Retail", "+1 555-0199", now);

  // Leads
  const insertLead = db.prepare(
    `INSERT INTO leads (id, org_id, name, email, phone, company, source, status, priority, owner_id, follow_up_date, estimated_value, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertLead.run("lead_1", orgId, "Elena Rostova", "client@apexretail.com", "+1 555-0199", "Apex Retail Group", "Inbound Demo", "Qualified", "High", salesId, "2026-11-28", 48000, "Looking for full ERP & portal rollout in Q1.", now, now);
  insertLead.run("lead_2", orgId, "David Kim", "dkim@novamed.io", "+1 555-0244", "NovaMed Health", "LinkedIn", "Contacted", "High", salesId, "2026-11-27", 32500, "Requested security compliance overview.", now, now);
  insertLead.run("lead_3", orgId, "Sofia Alvarez", "salvarez@solarisenergy.co", "+1 555-0318", "Solaris Energy", "Partner Referral", "New", "Medium", ownerId, "2026-11-30", 19000, "Needs custom analytics & billing integration.", now, now);

  // Deals
  const insertDeal = db.prepare(
    `INSERT INTO deals (id, org_id, lead_id, title, company, contact_name, contact_email, value, stage, probability, expected_close_date, owner_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertDeal.run("deal_1", orgId, "lead_1", "Apex Retail Cloud Suite", "Apex Retail Group", "Elena Rostova", "client@apexretail.com", 48000, "Won", 100, "2026-11-20", salesId, "Signed master services agreement.", now, now);
  insertDeal.run("deal_2", orgId, "lead_2", "NovaMed Compliance Portal", "NovaMed Health", "David Kim", "dkim@novamed.io", 32500, "Proposal", 65, "2026-12-10", salesId, "Proposal sent; awaiting legal review.", now, now);
  insertDeal.run("deal_3", orgId, "lead_3", "Solaris Analytics Rollout", "Solaris Energy", "Sofia Alvarez", "salvarez@solarisenergy.co", 19000, "Negotiation", 80, "2026-12-05", ownerId, "Finalizing SLA terms.", now, now);
  insertDeal.run("deal_4", orgId, null, "Vanguard Logistics Automation", "Vanguard Logistics", "Liam O'Connor", "liam@vanguardlog.com", 27500, "Discovery", 30, "2026-12-22", salesId, "Initial discovery call completed.", now, now);

  // Quotations
  const insertQuote = db.prepare(
    `INSERT INTO quotations (id, org_id, deal_id, quote_number, title, client_name, client_email, client_company, items_json, subtotal, discount_percent, tax_percent, total, status, valid_until, notes, share_token, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertQuote.run(
    "qt_1",
    orgId,
    "deal_1",
    "QT-2026-001",
    "Apex Retail Cloud Suite Implementation",
    "Elena Rostova",
    "client@apexretail.com",
    "Apex Retail Group",
    JSON.stringify([
      { description: "Core SaaS Platform License (Annual)", quantity: 1, unitPrice: 24000 },
      { description: "Custom ERP & Portal Integration", quantity: 1, unitPrice: 18000 },
      { description: "Team Onboarding & Training", quantity: 2, unitPrice: 3000 },
    ]),
    48000,
    5,
    8,
    49248,
    "Approved",
    "2026-12-31",
    "Includes 99.9% uptime SLA and dedicated success manager.",
    "share_qt_apex_001",
    salesId,
    now,
    now
  );
  insertQuote.run(
    "qt_2",
    orgId,
    "deal_2",
    "QT-2026-002",
    "NovaMed Compliance Portal Phase 1",
    "David Kim",
    "dkim@novamed.io",
    "NovaMed Health",
    JSON.stringify([
      { description: "HIPAA-Ready Workspace Setup", quantity: 1, unitPrice: 20000 },
      { description: "Audit & Document Vault Module", quantity: 1, unitPrice: 12500 },
    ]),
    32500,
    0,
    8,
    35100,
    "Sent",
    "2026-12-15",
    "Net-30 payment terms upon milestone delivery.",
    "share_qt_novamed_002",
    salesId,
    now,
    now
  );

  // Projects
  const insertProject = db.prepare(
    `INSERT INTO projects (id, org_id, quotation_id, name, description, client_name, client_email, status, progress, start_date, end_date, manager_id, budget, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertProject.run(
    "proj_1",
    orgId,
    "qt_1",
    "Apex Retail Cloud Rollout",
    "End-to-end deployment of KROMA FLOW portal and billing workflows for Apex Retail.",
    "Elena Rostova",
    "client@apexretail.com",
    "In Progress",
    65,
    "2026-11-01",
    "2026-12-20",
    pmId,
    48000,
    now,
    now
  );

  db.prepare(
    `INSERT INTO project_milestones (id, org_id, project_id, title, due_date, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run("ms_1", orgId, "proj_1", "Architecture & SSO Setup", "2026-11-15", 1, now);
  db.prepare(
    `INSERT INTO project_milestones (id, org_id, project_id, title, due_date, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run("ms_2", orgId, "proj_1", "Client Portal UAT Sign-off", "2026-12-05", 0, now);

  // Tasks
  const insertTask = db.prepare(
    `INSERT INTO tasks (id, org_id, project_id, title, description, assignee_id, status, priority, due_date, subtasks_json, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertTask.run(
    "task_1",
    orgId,
    "proj_1",
    "Configure Apex Retail Client Portal",
    "Provision client role permissions and shared deliverables folder.",
    pmId,
    "In Progress",
    "High",
    "2026-11-29",
    JSON.stringify([
      { id: "st_1", title: "Verify client domain", done: true },
      { id: "st_2", title: "Upload onboarding pack", done: false },
    ]),
    ownerId,
    now,
    now
  );
  insertTask.run(
    "task_2",
    orgId,
    "proj_1",
    "Schedule NovaMed Security Review",
    "Coordinate with David Kim and infosec lead.",
    salesId,
    "Todo",
    "High",
    "2026-11-27",
    "[]",
    salesId,
    now,
    now
  );

  // Channels & Messages
  db.prepare(
    `INSERT INTO channels (id, org_id, name, type, project_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run("ch_general", orgId, "general", "team", null, now);
  db.prepare(
    `INSERT INTO channels (id, org_id, name, type, project_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run("ch_apex", orgId, "proj-apex-retail", "project", "proj_1", now);

  db.prepare(
    `INSERT INTO messages (id, org_id, channel_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run("msg_1", orgId, "ch_general", ownerId, "Welcome to KROMA FLOW! Q4 pipeline targets are tracking ahead of schedule.", now);
  db.prepare(
    `INSERT INTO messages (id, org_id, channel_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run("msg_2", orgId, "ch_apex", pmId, "Milestone 1 completed. Moving to Client Portal UAT with Elena this week.", now);

  // Calendar Events
  db.prepare(
    `INSERT INTO calendar_events (id, org_id, title, description, type, start_at, end_at, project_id, attendees_json, location, reminder_minutes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "evt_1",
    orgId,
    "Apex Retail UAT Walkthrough",
    "Live review of deliverables and invoice schedule.",
    "Meeting",
    "2026-11-26T10:00:00",
    "2026-11-26T11:00:00",
    "proj_1",
    JSON.stringify(["alex@kromaxzon.com", "marcus@kromaxzon.com", "client@apexretail.com"]),
    "Zoom / KROMA Meet",
    15,
    pmId,
    now
  );

  // Invoices & Payments
  db.prepare(
    `INSERT INTO invoices (id, org_id, project_id, quotation_id, invoice_number, client_name, client_email, client_company, items_json, subtotal, discount_percent, tax_percent, total, amount_paid, status, due_date, issued_at, notes, share_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "inv_1",
    orgId,
    "proj_1",
    "qt_1",
    "INV-2026-001",
    "Elena Rostova",
    "client@apexretail.com",
    "Apex Retail Group",
    JSON.stringify([{ description: "Apex Retail Cloud Suite — Deposit (50%)", quantity: 1, unitPrice: 24624 }]),
    24624,
    0,
    0,
    24624,
    24624,
    "Paid",
    "2026-11-20",
    "2026-11-05",
    "Thank you for your business!",
    "share_inv_apex_001",
    now,
    now
  );
  db.prepare(
    `INSERT INTO invoices (id, org_id, project_id, quotation_id, invoice_number, client_name, client_email, client_company, items_json, subtotal, discount_percent, tax_percent, total, amount_paid, status, due_date, issued_at, notes, share_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "inv_2",
    orgId,
    "proj_1",
    "qt_1",
    "INV-2026-002",
    "Elena Rostova",
    "client@apexretail.com",
    "Apex Retail Group",
    JSON.stringify([{ description: "Apex Retail Cloud Suite — Milestone 2", quantity: 1, unitPrice: 24624 }]),
    24624,
    0,
    0,
    24624,
    0,
    "Unpaid",
    "2026-12-10",
    "2026-11-22",
    "Due upon UAT sign-off.",
    "share_inv_apex_002",
    now,
    now
  );

  db.prepare(
    `INSERT INTO payments (id, org_id, invoice_id, amount, method, reference, status, confirmed_by_provider, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run("pay_1", orgId, "inv_1", 24624, "Wire Transfer", "WIRE-KMX-88412", "Confirmed", 1, now);

  // Documents
  const insertDoc = db.prepare(
    `INSERT INTO documents (id, org_id, folder, name, mime_type, size_bytes, content_text, is_template, project_id, shared_with_client, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertDoc.run("doc_1", orgId, "Proposals", "Enterprise SaaS Proposal Template.md", "text/markdown", 1024, "# KROMAXZON TECHNOLOGIES Proposal\n\n## Scope of Work\n- Discovery & Architecture\n- Implementation\n- Training & Go-Live", 1, null, 0, ownerId, now);
  insertDoc.run("doc_2", orgId, "Client Deliverables", "Apex Retail Onboarding Guide.md", "text/markdown", 840, "# Apex Retail Onboarding\n\nWelcome to KROMA FLOW. Your dedicated workspace and milestone tracker are live.", 0, "proj_1", 1, pmId, now);

  // Workflows
  const insertWf = db.prepare(
    `INSERT INTO workflows (id, org_id, name, description, trigger_type, conditions_json, actions_json, enabled, run_count, last_run_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertWf.run(
    "wf_1",
    orgId,
    "New Lead Auto-Routing",
    "Assigns new high-value leads to sales, notifies team, and schedules a follow-up.",
    "lead.created",
    JSON.stringify([{ field: "priority", operator: "equals", value: "High" }]),
    JSON.stringify([
      { type: "assign_owner", value: salesId },
      { type: "send_notification", value: "New high-priority lead assigned!" },
      { type: "create_task", value: "Follow up within 24 hours" },
    ]),
    1,
    3,
    now,
    now
  );
  insertWf.run(
    "wf_2",
    orgId,
    "Quotation Approved → Project Kickoff",
    "Automatically creates a project, notifies PM, and creates kickoff task when a quote is approved.",
    "quotation.approved",
    JSON.stringify([]),
    JSON.stringify([
      { type: "create_project", value: "From Approved Quotation" },
      { type: "send_notification", value: "Quotation approved — project created!" },
      { type: "create_task", value: "Schedule client kickoff call" },
    ]),
    1,
    1,
    now,
    now
  );

  // Notifications & Audit
  db.prepare(
    `INSERT INTO notifications (id, org_id, user_id, title, body, link, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run("notif_1", orgId, ownerId, "Quotation Approved", "Apex Retail Group approved QT-2026-001 ($49,248).", "/quotations", 0, now);

  db.prepare(
    `INSERT INTO audit_logs (id, org_id, user_id, action, entity_type, entity_id, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run("aud_1", orgId, ownerId, "workspace.initialized", "organisation", orgId, JSON.stringify({ name: "KROMAXZON TECHNOLOGIES" }), now);
}
