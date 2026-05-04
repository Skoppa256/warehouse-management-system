import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
