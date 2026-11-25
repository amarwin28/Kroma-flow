import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logAudit, requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth("docs:read");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "";
  const q = searchParams.get("q") || "";

  const db = getDb();
  let sql = `SELECT d.*, u.name as uploader_name
             FROM documents d LEFT JOIN users u ON u.id = d.uploaded_by
             WHERE d.org_id = ?`;
  const params: string[] = [auth.user.orgId];

  if (folder) {
    sql += " AND d.folder = ?";
    params.push(folder);
  }
  if (q) {
    sql += " AND (d.name LIKE ? OR d.content_text LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY d.created_at DESC";

  const documents = db.prepare(sql).all(...params);
  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const auth = await requireAuth("docs:write");
  if ("error" in auth) return auth.error;

  const contentType = req.headers.get("content-type") || "";
  const db = getDb();
  const now = new Date().toISOString();
  const id = `doc_${crypto.randomUUID()}`;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = String(formData.get("folder") || "General");
    const sharedWithClient = formData.get("sharedWithClient") === "true" ? 1 : 0;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const { uploadDir } = getEnv();
    const orgDir = path.join(uploadDir, auth.user.orgId);
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir, { recursive: true });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = path.join(orgDir, `${id}_${safeName}`);
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(storagePath, buf);

    const previewText = file.type.startsWith("text/") || file.name.endsWith(".md")
      ? buf.toString("utf8").slice(0, 8000)
      : "";

    db.prepare(
      `INSERT INTO documents (id, org_id, folder, name, mime_type, size_bytes, content_text, storage_path, is_template, shared_with_client, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    ).run(
      id,
      auth.user.orgId,
      folder,
      file.name,
      file.type || "application/octet-stream",
      buf.length,
      previewText,
      storagePath,
      sharedWithClient,
      auth.user.id,
      now
    );

    logAudit({
      orgId: auth.user.orgId,
      userId: auth.user.id,
      action: "document.uploaded",
      entityType: "document",
      entityId: id,
      details: { name: file.name, size: buf.length },
    });

    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
    return NextResponse.json({ document: doc }, { status: 201 });
  }

  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "Document name is required" }, { status: 400 });
  }

  const contentText = String(body.contentText || "");
  db.prepare(
    `INSERT INTO documents (id, org_id, folder, name, mime_type, size_bytes, content_text, is_template, shared_with_client, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, 'text/markdown', ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    auth.user.orgId,
    String(body.folder || "Notes"),
    String(body.name),
    Buffer.byteLength(contentText, "utf8"),
    contentText,
    body.isTemplate ? 1 : 0,
    body.sharedWithClient ? 1 : 0,
    auth.user.id,
    now
  );

  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
  return NextResponse.json({ document: doc }, { status: 201 });
}
