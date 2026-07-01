"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";

interface EmojiPickerModalProps {
  open: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  /** element the picker should anchor itself to */
  anchorRef: React.RefObject<HTMLElement>;
  /** preferred side relative to the anchor */
  side?: "top" | "bottom";
}

/**
 * Wraps `emoji-picker-react` in a floating popover anchored to a trigger
 * button (the smiley icon), matching Slack's reaction-picker behavior:
 * click to open, click outside or Escape to close, positioned above/below
 * the trigger depending on available space.
 *
 * npm install emoji-picker-react
 */
export function EmojiPickerModal({
  open,
  onClose,
  onEmojiSelect,
  anchorRef,
  side = "bottom",
}: EmojiPickerModalProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const pickerHeight = 420;
    const pickerWidth = 320;
    const gap = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeBelow = side === "bottom" && spaceBelow > pickerHeight;

    const top = placeBelow
      ? rect.bottom + gap
      : Math.max(8, rect.top - pickerHeight - gap);

    const left = Math.min(
      Math.max(8, rect.right - pickerWidth),
      window.innerWidth - pickerWidth - 8,
    );

    setCoords({ top, left });
  }, [open, anchorRef, side]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
      }}
      className="animate-in fade-in zoom-in-95 duration-150 rounded-lg border border-border/60 shadow-xl overflow-hidden"
    >
      <EmojiPicker
        onEmojiClick={(emojiData: EmojiClickData) => {
          onEmojiSelect(emojiData.emoji);
          onClose();
        }}
        theme={Theme.AUTO}
        lazyLoadEmojis
        searchPlaceHolder="Search all emoji"
        previewConfig={{ showPreview: false }}
        width={320}
        height={400}
      />
    </div>,
    document.body,
  );
}
