"use client";

import { logout } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Topbar() {
  const pathname = usePathname();

  // Convert pathname into CLEAN PAGE TITLE
  const title = pathname === "/"
    ? "DASHBOARD"
    : pathname
        .replace("/", "")
        .replace("-", " ")
        .toUpperCase();

  return (
    <header
      className="
        flex items-center justify-between
        h-14 px-6
        bg-[#0b0c0f]
        border-b border-[#1e1f22]
        font-mono tracking-widest
      "
    >
      {/* PAGE TITLE */}
      <h1 className="text-xs text-white">{title}</h1>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="
          flex items-center gap-2
          text-[11px] text-gray-500
          hover:text-white transition
        "
      >
        <LogOut size={14} className="opacity-80" />
        LOGOUT
      </button>
    </header>
  );
}
