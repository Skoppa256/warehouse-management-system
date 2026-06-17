"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

/**
 * Product image with a built-in placeholder.
 *
 * Shows the product photo when `imagePath` is set and loads successfully.
 * Falls back to a themed placeholder when there is no image OR when the image
 * fails to load (e.g. a stale/remote URL that 404s) — so a missing photo never
 * renders as a broken-image icon.
 */
export default function ProductImage({
  imagePath,
  alt,
  className = "",
  iconSize = 32,
}: {
  imagePath?: string | null;
  alt: string;
  /** Sizing/rounding classes — applied to both the photo and the placeholder. */
  className?: string;
  iconSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(imagePath) && !failed;

  if (showPhoto) {
    return (
      <img
        src={`${API_BASE_URL}${imagePath}`}
        alt={alt}
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 bg-[var(--muted)] text-[var(--muted-foreground)] ${className}`}
      role="img"
      aria-label={`${alt} (no image)`}
    >
      <ImageOff size={iconSize} className="opacity-60" />
      <span className="text-xs">No image</span>
    </div>
  );
}
