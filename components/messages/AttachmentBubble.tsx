"use client";

import { FileText, Download, Image as ImageIcon } from "lucide-react";
import type { AttachmentMetadata } from "@/lib/messaging/metadata";

type Props = {
  metadata: AttachmentMetadata;
  isMine: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentBubble({ metadata, isMine }: Props) {
  const isImage = metadata.mime_type.startsWith("image/");
  const isVideo = metadata.mime_type.startsWith("video/");

  if (isImage) {
    return (
      <a
        href={metadata.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden max-w-[280px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={metadata.file_url}
          alt={metadata.file_name}
          className="w-full h-auto object-cover rounded-xl"
          style={{
            maxHeight: "300px",
            aspectRatio: metadata.width && metadata.height ? `${metadata.width}/${metadata.height}` : undefined,
          }}
        />
        <div className={`px-2 py-1 text-[10px] ${isMine ? "text-black/40" : "text-white/25"}`}>
          {metadata.file_name} &middot; {formatFileSize(metadata.file_size)}
        </div>
      </a>
    );
  }

  if (isVideo) {
    return (
      <div className="rounded-xl overflow-hidden max-w-[280px]">
        <video
          src={metadata.file_url}
          controls
          className="w-full h-auto rounded-xl"
          style={{ maxHeight: "300px" }}
        />
        <div className={`px-2 py-1 text-[10px] ${isMine ? "text-black/40" : "text-white/25"}`}>
          {metadata.file_name} &middot; {formatFileSize(metadata.file_size)}
        </div>
      </div>
    );
  }

  // Generic file
  return (
    <a
      href={metadata.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        isMine ? "hover:bg-black/10" : "hover:bg-white/[0.04]"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        isMine ? "bg-black/10" : "bg-white/[0.06]"
      }`}>
        <FileText size={18} className={isMine ? "text-black/50" : "text-white/40"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate ${isMine ? "text-black/80" : "text-white/70"}`}>
          {metadata.file_name}
        </p>
        <p className={`text-[10px] ${isMine ? "text-black/40" : "text-white/30"}`}>
          {formatFileSize(metadata.file_size)} &middot; {metadata.mime_type.split("/")[1]?.toUpperCase() || "FILE"}
        </p>
      </div>
      <Download size={14} className={isMine ? "text-black/30" : "text-white/20"} />
    </a>
  );
}
