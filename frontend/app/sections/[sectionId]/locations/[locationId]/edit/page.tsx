"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

export default function EditLocationPage() {
  const router = useRouter();
  const { sectionId, locationId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    type: "BIN",
  });

  async function loadData() {
    try {
      const loc = await api(`/sections/${sectionId}/locations/${locationId}`);

      setForm({
        code: loc.code,
        type: loc.type,
      });

    } catch (err) {
      console.error("Failed loading location:", err);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);

    try {
      await api(`/sections/${sectionId}/locations/${locationId}`, {
        method: "PATCH",
        body: JSON.stringify({
          code: form.code,
          type: form.type,
        }),
      });

      router.push(`/sections/${sectionId}/locations/${locationId}`);
    } catch (err) {
      console.error("Location update failed:", err);
      alert("Failed to save changes");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-xs font-mono text-gray-500">LOADING LOCATION...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-10">
        <h1 className="text-xl font-mono tracking-widest text-white mb-1">
          EDIT LOCATION
        </h1>
        <p className="text-xs font-mono text-gray-500 tracking-widest">
          UPDATE LOCATION DETAILS
        </p>
      </div>

      <Card className="p-8 bg-[#111217] border border-[#1c1d22] rounded-xl space-y-8 max-w-xl">

        {/* CODE */}
        <Field label="CODE">
          <input
            value={form.code}
            onChange={(e) => updateField("code", e.target.value)}
            className="input-style"
            placeholder="Location code"
          />
        </Field>

        {/* TYPE */}
        <Field label="TYPE">
          <select
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="input-style"
          >
            <option value="BIN">BIN</option>
            <option value="SECTION">SECTION</option>
          </select>
        </Field>

        {/* SAVE */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="
              px-6 py-2.5 rounded-lg 
              bg-white text-black font-mono text-xs tracking-widest
              hover:bg-gray-200 transition w-full md:w-auto
            "
          >
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </Card>
    </DashboardShell>
  );
}

/* Shared field wrapper */
function Field({ label, children }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-gray-400 text-[11px] font-mono tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

/* Shared input style */
const inputStyles = `
  w-full rounded-lg p-2.5 text-sm
  bg-[#0e0f13] border border-[#1c1d22]
  focus:border-white outline-none font-mono
`;
