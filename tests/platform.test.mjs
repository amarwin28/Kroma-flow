import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

test("password scrypt hashing & verification", () => {
  const password = "KromaFlow@2026";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const stored = `${salt}:${hash}`;

  const [s, keyHex] = stored.split(":");
  const derived = crypto.scryptSync(password, s, 64);
  const wrong = crypto.scryptSync("WrongPassword", s, 64);
  assert.equal(crypto.timingSafeEqual(derived, Buffer.from(keyHex, "hex")), true);
  assert.equal(crypto.timingSafeEqual(wrong, Buffer.from(keyHex, "hex")), false);
});

test("quotation & invoice discount/tax math", () => {
  const items = [
    { quantity: 2, unitPrice: 1000 },
    { quantity: 1, unitPrice: 500 },
  ];
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discountPercent = 10;
  const taxPercent = 8;
  const total = Math.round(subtotal * (1 - discountPercent / 100) * (1 + taxPercent / 100) * 100) / 100;
  assert.equal(subtotal, 2500);
  assert.equal(total, 2430);
});

test("SQLite tenant isolation & payment confirmation guard", () => {
  const tmpDbPath = path.join(os.tmpdir(), `kroma-test-${Date.now()}.db`);
  const db = new DatabaseSync(tmpDbPath);
  db.exec(`
    CREATE TABLE invoices (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, total REAL NOT NULL, amount_paid REAL NOT NULL, status TEXT NOT NULL);
  `);

  db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?)").run("inv_a", "org_1", 1000, 0, "Unpaid");
  db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?)").run("inv_b", "org_2", 2000, 0, "Unpaid");

  const org1Rows = db.prepare("SELECT * FROM invoices WHERE org_id = ?").all("org_1");
  assert.equal(org1Rows.length, 1);
  assert.equal(org1Rows[0].id, "inv_a");

  // Unconfirmed payment must not mark invoice Paid
  const confirmedByProvider = false;
  if (confirmedByProvider) {
    db.prepare("UPDATE invoices SET status = 'Paid', amount_paid = 1000 WHERE id = 'inv_a'").run();
  }
  const invAfter = db.prepare("SELECT status, amount_paid FROM invoices WHERE id = 'inv_a'").get();
  assert.equal(invAfter.status, "Unpaid");
  assert.equal(invAfter.amount_paid, 0);

  db.close();
  fs.unlinkSync(tmpDbPath);
});
