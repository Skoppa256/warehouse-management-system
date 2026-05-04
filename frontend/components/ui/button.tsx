"use client";

import React from "react";

type Variant = "primary" | "ghost" | "danger";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";

  const styles: Record<Variant, string> = {
    primary:
      "bg-[var(--accent)] text-black hover:bg-emerald-400 focus:ring-[var(--accent)]",
    ghost:
      "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] focus:ring-[var(--border-subtle)]",
    danger:
      "bg-[var(--danger)] text-black hover:bg-red-400 focus:ring-[var(--danger)]",
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
