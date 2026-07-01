"use client";

import React, { useState, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: TooltipSide;
  delay?: number;
  className?: string;
}

/**
 * Lightweight, dependency-free tooltip. Positions itself relative to the
 * trigger using getBoundingClientRect + a portal, so it always renders on
 * top of everything else (no clipping by overflow:hidden ancestors).
 *
 * Usage:
 *   <Tooltip content="Add reaction" side="top">
 *     <button>...</button>
 *   </Tooltip>
 */
export function Tooltip({
  content,
  children,
  side = "top",
  delay = 300,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const computePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (side) {
      case "top":
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
    }

    setCoords({ top, left });
  };

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      computePosition();
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  const child = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      (children.props as any).onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      (children.props as any).onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      (children.props as any).onFocus?.(e);
      computePosition();
      setOpen(true);
    },
    onBlur: (e: React.FocusEvent) => {
      (children.props as any).onBlur?.(e);
      hide();
    },
    "aria-describedby": open ? id : undefined,
  } as any);

  const childWithRef = React.cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      if (node) {
        triggerRef.current = node;
        // preserve any existing ref on the child
        const childRef = (children as any).ref;
        if (typeof childRef === "function") childRef(node);
        else if (childRef) childRef.current = node;
      }
    },
  } as any);

  const transformBySide: Record<TooltipSide, string> = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
    left: "translate(-100%, -50%)",
    right: "translate(0, -50%)",
  };

  // small triangular caret, positioned relative to the bubble
  const caretBySide: Record<TooltipSide, string> = {
    top: "left-1/2 top-full -translate-x-1/2 border-t-[6px] border-t-[#1a1a1a] border-x-[5px] border-x-transparent",
    bottom:
      "left-1/2 bottom-full -translate-x-1/2 border-b-[6px] border-b-[#1a1a1a] border-x-[5px] border-x-transparent",
    left: "top-1/2 left-full -translate-y-1/2 border-l-[6px] border-l-[#1a1a1a] border-y-[5px] border-y-transparent",
    right:
      "top-1/2 right-full -translate-y-1/2 border-r-[6px] border-r-[#1a1a1a] border-y-[5px] border-y-transparent",
  };

  return (
    <>
      {child}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: transformBySide[side],
              zIndex: 9999,
            }}
            className="pointer-events-none animate-in fade-in zoom-in-95 duration-100"
          >
            <div
              className={cn(
                "relative whitespace-nowrap rounded-md bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
                className,
              )}
            >
              {content}
              <span
                className={cn("absolute h-0 w-0", caretBySide[side])}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
