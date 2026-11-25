"use client";

import React, { useState } from "react";
import { Hash, Send, Search, Plus, Paperclip } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { formatIndianDateTime } from "@/data/format";

export default function ChatPage() {
  const { state, sendChatMessage, createChatChannel } = useDemoData();
  const [activeChannelId, setActiveChannelId] = useState(
    state.chatChannels[0]?.id || "ch-general"
  );
  const [content, setContent] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [newChannel, setNewChannel] = useState("");

  const activeChannel = state.chatChannels.find((c) => c.id === activeChannelId);

  const messages = state.chatMessages.filter((m) => {
    if (m.channelId !== activeChannelId) return false;
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q)
    );
  });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !activeChannelId) return;
    sendChatMessage(activeChannelId, content.trim(), attachmentName.trim() || undefined);
    setContent("");
    setAttachmentName("");
  }

  function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newChannel.trim()) return;
    const id = createChatChannel(newChannel.trim());
    setNewChannel("");
    setActiveChannelId(id);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
            Team & Project Communication
          </h1>
          <Badge tone="amber">DEMO DATA</Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Workspace channels, project discussions, and file sharing across KROMAXZON TECHNOLOGIES.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[520px]">
        <Card className="p-3.5 space-y-3 md:col-span-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Channels ({state.chatChannels.length})
          </span>
          <div className="space-y-1">
            {state.chatChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  activeChannelId === ch.id
                    ? "bg-[#1d6bff] text-white"
                    : "text-[#0b1f44] hover:bg-[#eff5ff]"
                }`}
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleCreateChannel} className="pt-2 border-t border-[#eff5ff] flex gap-1.5">
            <input
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="New channel..."
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#dce7f8] text-xs"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-[#eff5ff] text-[#1d6bff] hover:bg-[#dbeafe] cursor-pointer"
              aria-label="Create channel"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </Card>

        <Card className="p-4 flex flex-col md:col-span-3 min-h-[460px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#eff5ff]">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#1d6bff]" />
              <h2 className="text-sm font-bold text-[#0b1f44]">
                {activeChannel?.name || "general"}
              </h2>
            </div>
            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#dce7f8] text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[380px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-[#f4f8ff] border border-[#dce7f8] space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <strong className="text-[#0b1f44]">{m.senderName}</strong>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-[#dce7f8] text-[10px] font-semibold text-[#1d6bff]">
                      {m.senderRole}
                    </span>
                  </div>
                  <span className="text-slate-400">{formatIndianDateTime(m.createdAt)}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#0b1f44]">{m.content}</p>
                {m.attachmentName && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#dce7f8] text-[11px] font-semibold text-[#1d6bff] mt-1">
                    <Paperclip className="w-3 h-3" /> {m.attachmentName}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="pt-3 border-t border-[#eff5ff] space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Message #${activeChannel?.name || "general"}...`}
                className="flex-1 min-h-[42px] px-3.5 rounded-xl border border-[#dce7f8] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d6bff]/30"
              />
              <input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Attachment name (optional)"
                className="sm:w-48 min-h-[42px] px-3 rounded-xl border border-[#dce7f8] text-xs"
              />
              <Button type="submit">
                <Send className="w-4 h-4" /> Send
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
