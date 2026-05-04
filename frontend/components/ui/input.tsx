"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="text-xs font-medium text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[#090a0f] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--danger)] mt-0.5">{error}</p>
      )}
    </div>
  );
}
