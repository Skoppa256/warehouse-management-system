"use client";

import React, { useRef } from "react";

interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (v: string) => void;
}

export default function CodeInput({
  length = 6,
  value,
  onChange,
}: CodeInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (idx: number, char: string) => {
    if (!/^[0-9a-zA-Z]?$/.test(char)) return;

    const chars = value.split("");
    chars[idx] = char.toUpperCase();
    const newValue = chars.join("");
    onChange(newValue);

    if (char && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {inputs.current[i] = el!;}}
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-10 h-12 text-center text-lg font-semibold rounded-md border border-[var(--border-subtle)] bg-[#090a0f] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
        />
      ))}
    </div>
  );
}
