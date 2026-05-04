"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function EditSectionPage() {
  const router = useRouter();
  const params = useParams();
  const sectionId = params?.sectionId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    description: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await api(`/sections/${sectionId}`);
        setForm({
          code: data.section?.code || data.code || "",
          description: data.section?.description || data.description || "",
        });
      } catch (err) {
        console.error("Failed loading section:", err);
      }
      setLoading(false);
    }
    load();
  }, [sectionId]);

  function updateField(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function save() {
    setSaving(true);
    try {
      await api(`/sections/${sectionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          code: form.code,
          description: form.description || null,
        }),
      });
      router.push(`/sections/${sectionId}`);
    } catch (err) {
      console.error("Save section failed:", err);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-gray-500 font-mono tracking-widest">
          LOADING SECTION...
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-10">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/sections/${sectionId}`)}
            className="p-2 hover:bg-[#1a1b1f] rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-mono tracking-widest">EDIT SECTION</h1>
        </div>

        {/* FORM CARD */}
        <Card className="p-6 bg-[#111217] border border-[#1c1d22] rounded-xl">

          <div className="space-y-6 font-mono tracking-wider">

            {/* CODE FIELD */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] tracking-widest text-gray-400">
                CODE
              </label>
              <input
                className="
                  bg-[#0e0f12] px-3 py-2 rounded-lg
                  border border-[#2a2c32]
                  text-sm text-white outline-none
                "
                value={form.code}
                onChange={(e) => updateField("code", e.target.value)}
              />
            </div>

            {/* DESCRIPTION FIELD */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] tracking-widest text-gray-400">
                DESCRIPTION
              </label>
              <textarea
                rows={3}
                className="
                  bg-[#0e0f12] px-3 py-2 rounded-lg
                  border border-[#2a2c32]
                  text-sm text-white outline-none
                "
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
          </div>

          {/* SAVE */}
          <div className="flex justify-end mt-6">
            <button
              onClick={save}
              disabled={saving}
              className="
                px-4 py-2 rounded-lg bg-white text-black
                font-mono text-xs tracking-widest font-semibold
                hover:bg-gray-200 transition
              "
            >
              {saving ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>

        </Card>
      </div>
    </DashboardShell>
  );
}
