"use client";

import React from "react";

export default function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
        <button className="mt-4 text-sm text-gray-600" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
