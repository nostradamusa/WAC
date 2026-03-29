"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Mic } from "lucide-react";

type Props = {
  audioUrl: string;
  durationSeconds: number;
  isMine: boolean;
};

export default function VoiceNotePlayer({ audioUrl, durationSeconds, isMine }: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && isFinite(audio.duration)) {
      setProgress(audio.currentTime / audio.duration);
      setCurrentTime(audio.currentTime);
    }
    if (!audio.paused) {
      animRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setPlaying(false);
    } else {
      void audio.play();
      animRef.current = requestAnimationFrame(updateProgress);
      setPlaying(true);
    }
  }, [playing, updateProgress]);

  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
    setCurrentTime(audio.currentTime);
  }, []);

  // Generate static waveform bars from duration
  const barCount = Math.min(32, Math.max(12, Math.round(durationSeconds * 2)));

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      {/* Play/pause button */}
      <button
        type="button"
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isMine
            ? "bg-black/15 text-black/70 hover:bg-black/25"
            : "bg-[#b08d57]/15 text-[#b08d57] hover:bg-[#b08d57]/25"
        }`}
      >
        {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Waveform bars */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div
          className="flex items-center gap-[2px] h-5 cursor-pointer"
          onClick={handleBarClick}
        >
          {Array.from({ length: barCount }).map((_, i) => {
            const ratio = i / barCount;
            const filled = ratio <= progress;
            // Pseudo-random heights based on index
            const h = 6 + ((i * 7 + 3) % 14);
            return (
              <div
                key={i}
                className={`w-[2.5px] rounded-full transition-colors duration-100 ${
                  filled
                    ? isMine ? "bg-black/50" : "bg-[#b08d57]/70"
                    : isMine ? "bg-black/15" : "bg-white/15"
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5">
          <Mic size={10} className={isMine ? "text-black/30" : "text-white/25"} />
          <span className={`text-[10px] font-mono tabular-nums ${isMine ? "text-black/40" : "text-white/30"}`}>
            {playing || currentTime > 0 ? formatTime(currentTime) : formatTime(durationSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
