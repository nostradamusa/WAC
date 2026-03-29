"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Send, Trash2 } from "lucide-react";

type Props = {
  onSend: (blob: Blob, durationSeconds: number, mimeType: string) => void;
  onCancel: () => void;
};

export default function VoiceNoteRecorder({ onSend, onCancel }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "recorded">("idle");
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blobRef = useRef<Blob | null>(null);

  // Preferred MIME types in order
  const getMimeType = useCallback(() => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "audio/webm";
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
    };
  }, [clearTimer, stopStream]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        blobRef.current = blob;
        stopStream();
        setState("recorded");
      };

      recorder.start(100); // 100ms chunks for responsiveness
      setElapsed(0);
      setState("recording");

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      onCancel();
    }
  }, [getMimeType, stopStream, onCancel]);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [clearTimer]);

  const handleSend = useCallback(() => {
    if (!blobRef.current) return;
    const mimeType = getMimeType();
    onSend(blobRef.current, elapsed, mimeType);
  }, [elapsed, getMimeType, onSend]);

  const handleDiscard = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    blobRef.current = null;
    stopStream();
    onCancel();
  }, [clearTimer, stopStream, onCancel]);

  // Auto-start recording on mount
  useEffect(() => {
    if (state === "idle") {
      void startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Discard */}
      <button
        type="button"
        onClick={handleDiscard}
        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-400/[0.06] transition-colors"
        title="Discard"
      >
        <Trash2 size={18} strokeWidth={1.8} />
      </button>

      {/* Waveform / recording indicator */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1A1A1A] border border-white/[0.06]">
        {state === "recording" && (
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        )}
        {state === "recorded" && (
          <Mic size={16} className="text-[#b08d57] shrink-0" />
        )}

        {/* Visual waveform bars */}
        <div className="flex-1 flex items-center gap-[2px] h-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`w-[3px] rounded-full transition-all duration-150 ${
                state === "recording"
                  ? "bg-[#b08d57]/60 animate-pulse"
                  : "bg-white/15"
              }`}
              style={{
                height: state === "recording"
                  ? `${8 + Math.sin(Date.now() / 200 + i * 0.5) * 12}px`
                  : `${6 + (i % 3) * 4}px`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <span className={`text-[13px] font-mono tabular-nums shrink-0 ${
          state === "recording" ? "text-red-400/80" : "text-white/40"
        }`}>
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Stop / Send */}
      {state === "recording" ? (
        <button
          type="button"
          onClick={stopRecording}
          className="w-10 h-10 shrink-0 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
          title="Stop recording"
        >
          <Square size={14} fill="currentColor" />
        </button>
      ) : state === "recorded" ? (
        <button
          type="button"
          onClick={handleSend}
          className="w-10 h-10 shrink-0 rounded-xl bg-[#b08d57] text-black flex items-center justify-center hover:bg-[#9a7545] transition-colors"
          title="Send voice note"
        >
          <Send size={15} />
        </button>
      ) : null}
    </div>
  );
}
