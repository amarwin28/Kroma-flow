"use client";

import React, { useState } from "react";
import { FileText, Folder, Search, Eye, Plus } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Textarea } from "@/components/ui";
import { formatIndianDate } from "@/data/format";

interface DemoDoc {
  id: string;
  folder: string;
  name: string;
  sizeLabel: string;
  contentText: string;
  sharedWithClient: boolean;
  uploaderName: string;
  createdAt: string;
}

const INITIAL_DOCS: DemoDoc[] = [
  {
    id: "doc-1",
    folder: "Contracts & MSA",
    name: "TechCorp_Solutions_MSA_2026.pdf",
    sizeLabel: "420 KB",
    contentText: "Master Services Agreement between KROMAXZON TECHNOLOGIES and TechCorp Solutions for Website Redesign & SaaS Billing Portal.",
    sharedWithClient: true,
    uploaderName: "Aarav Kulkarni",
    createdAt: "2026-10-12",
  },
  {
    id: "doc-2",
    folder: "Proposals",
    name: "NextGen_Mobile_Architecture_v2.pdf",
    sizeLabel: "1.2 MB",
    contentText: "Technical architecture covering React Native, biometric JWT refresh, and Razorpay SDK.",
    sharedWithClient: true,
    uploaderName: "Siddharth Joshi",
    createdAt: "2026-11-08",
  },
  {
    id: "doc-3",
    folder: "Meeting Notes",
    name: "Innovate_Labs_UAT_Checklist.md",
    sizeLabel: "38 KB",
    contentText: "Checklist for GST invoice generation, Razorpay webhook verification, and 500-user load test.",
    sharedWithClient: false,
    uploaderName: "Neha Kapoor",
    createdAt: "2026-11-20",
  },
  {
    id: "doc-4",
    folder: "Finance & GST",
    name: "Q3_GST_Reconciliation_Summary.xlsx",
    sizeLabel: "215 KB",
    contentText: "Quarterly GST & TDS summary for paid demo invoices INV-1043, INV-1041, INV-1038, INV-1032.",
    sharedWithClient: false,
    uploaderName: "Pooja Bansal",
    createdAt: "2026-11-22",
  },
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DemoDoc[]>(INITIAL_DOCS);
  const [q, setQ] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DemoDoc | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("Meeting Notes");
  const [contentText, setContentText] = useState("");

  const filtered = docs.filter(
    (d) =>
      !q.trim() ||
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.folder.toLowerCase().includes(q.toLowerCase())
  );

  function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    setDocs([
      {
        id: `doc-${Date.now()}`,
        folder,
        name: name.endsWith(".md") ? name : `${name}.md`,
        sizeLabel: "12 KB",
        contentText,
        sharedWithClient: false,
        uploaderName: "Aarav Kulkarni",
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...docs,
    ]);
    setNoteOpen(false);
    setName("");
    setContentText("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Cloud Storage & Docs
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Centralized contracts, proposals, meeting notes, and GST documents.
          </p>
        </div>
        <Button onClick={() => setNoteOpen(true)}>
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search documents or folders..."
            className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-[#dce7f8] text-sm"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((d) => (
          <Card key={d.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-[#1d6bff] font-semibold">
                <Folder className="w-3.5 h-3.5" /> {d.folder}
                {d.sharedWithClient && <Badge tone="green">Client Shared</Badge>}
              </div>
              <p className="text-sm font-bold text-[#0b1f44] truncate mt-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" /> {d.name}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {d.uploaderName} · {d.sizeLabel} · {formatIndianDate(d.createdAt)}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPreviewDoc(d)}>
              <Eye className="w-3.5 h-3.5" /> View
            </Button>
          </Card>
        ))}
      </div>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Create Demo Note">
        <form onSubmit={handleCreateNote} className="space-y-3">
          <Input label="Document Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Folder" value={folder} onChange={(e) => setFolder(e.target.value)} />
          <Textarea label="Content" rows={4} required value={contentText} onChange={(e) => setContentText(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button type="submit">Save Note</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(previewDoc)} onClose={() => setPreviewDoc(null)} title={previewDoc?.name || ""}>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{previewDoc?.contentText}</p>
      </Modal>
    </div>
  );
}
