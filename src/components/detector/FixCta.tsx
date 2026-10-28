"use client";

// 检测结果后的本地修复入口：先说明第三方客户端与下载方式，再由用户确认跳转。
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DetectorLocaleText } from "@/detection/locale";

export function FixCta({ text, url }: { text: DetectorLocaleText["fix"]; url: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // 等浏览器的 target="_blank" 新标签动作开始后再卸载弹窗，避免同步移除链接导致导航被取消。
  const closeAfterDownload = () => {
    window.setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} title={text.hint} aria-haspopup="dialog" className="mt-5 min-h-12 w-full cursor-pointer rounded-full bg-[#facc15] px-4 py-2.5 text-sm font-black leading-5 text-[#0b1220] shadow-lg shadow-amber-900/15 transition hover:bg-[#eab308]">
        {text.cta}
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-[#0b1220]/60 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div role="dialog" aria-modal="true" aria-labelledby="fix-dialog-title" aria-describedby="fix-dialog-desc" className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl shadow-stone-950/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d97757] sm:text-xs sm:tracking-[0.2em]">{text.dialogProvider}</p>
                  <h3 id="fix-dialog-title" className="mt-2 text-2xl font-black leading-tight text-[#0b1220]">{text.dialogTitle}</h3>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label={text.dialogCancel} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-[#0b1220]">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <p id="fix-dialog-desc" className="mt-3 text-sm leading-7 text-stone-600">{text.dialogDesc}</p>
              <p className="mt-3 rounded-2xl bg-[#fffaf3] p-3 text-xs font-semibold leading-5 text-stone-600 ring-1 ring-stone-200">{text.dialogNote}</p>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button ref={cancelRef} type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-black text-stone-600 transition hover:border-stone-400">
                  {text.dialogCancel}
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer" onClick={closeAfterDownload} className="cursor-pointer rounded-full bg-[#0b1220] px-4 py-2.5 text-center text-sm font-black text-white transition hover:bg-[#d97757]">
                  {text.dialogConfirm}
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
