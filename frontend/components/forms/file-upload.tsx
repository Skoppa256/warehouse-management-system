"use client";

export default function FileUpload({
  onChange,
}: {
  onChange: (file: File | null) => void;
}) {
  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => onChange(e.target.files?.[0] || null)}
      className="block w-full text-sm border rounded-md p-2"
    />
  );
}
