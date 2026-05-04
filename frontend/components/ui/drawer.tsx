"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <>
      {/* BACKDROP */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* PANEL */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[420px]
          bg-[#111217] border-l border-[#2a2d31]
          shadow-xl transform transition-transform
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2d31]">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">{children}</div>
      </div>
    </>
  );
}
