"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { api } from "@/lib/api";

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
  });

  /** Load Supplier */
  useEffect(() => {
    async function loadSupplier() {
      try {
        const data = await api(`/supplier/${id}`);

        setForm({
          code: data.code,
          name: data.name,
          contact: data.contact ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
        });
      } catch (err) {
        console.error("Failed loading supplier:", err);
      }
      setLoading(false);
    }

    loadSupplier();
  }, [id]);

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /** Save Changes */
  async function saveSupplier() {
    setSaving(true);

    try {
      await api(`/supplier/${id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      router.push("/suppliers");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save supplier.");
    }

    setSaving(false);
  }

  if (loading)
    return (
      <DashboardShell>
        <p className="text-xs text-gray-500 font-mono tracking-wide">
          Loading supplier...
        </p>
      </DashboardShell>
    );

  return (
    <DashboardShell>
      <h1 className="text-xl font-mono tracking-widest font-semibold mb-6">
        EDIT SUPPLIER
      </h1>

      <Card
        className="
          p-8 bg-[#111217] border border-[#1c1d22] rounded-xl
          shadow-lg
        "
      >
        {/* FORM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* CODE */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-widest text-gray-500">
              CODE
            </label>
            <input
              className="
                w-full p-2 rounded-lg text-sm font-mono
                bg-[#1a1c20] border border-[#2a2c32]
                text-gray-400 cursor-not-allowed
              "
              value={form.code}
              disabled
            />
          </div>

          {/* NAME */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-widest text-gray-500">
              NAME
            </label>
            <input
              className="
                w-full p-2 rounded-lg text-sm font-mono
                bg-[#0e0f13] border border-[#1c1d22] focus:border-white
              "
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          {/* CONTACT */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-widest text-gray-500">
              CONTACT PERSON
            </label>
            <input
              className="
                w-full p-2 rounded-lg text-sm font-mono
                bg-[#0e0f13] border border-[#1c1d22]
              "
              value={form.contact}
              onChange={(e) => updateField("contact", e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-widest text-gray-500">
              EMAIL
            </label>
            <input
              type="email"
              className="
                w-full p-2 rounded-lg text-sm font-mono
                bg-[#0e0f13] border border-[#1c1d22]
              "
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>

          {/* PHONE */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-widest text-gray-500">
              PHONE
            </label>
            <input
              className="
                w-full p-2 rounded-lg text-sm font-mono
                bg-[#0e0f13] border border-[#1c1d22]
              "
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          {/* ADDRESS */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-[10px] font-mono tracking-widest text-gray-500">
              ADDRESS
            </label>
            <textarea
              className="
                w-full p-2 rounded-lg text-sm font-mono h-24 resize-none
                bg-[#0e0f13] border border-[#1c1d22]
              "
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={saveSupplier}
            disabled={saving}
            className="
              w-full md:w-auto py-2.5 rounded-lg
              bg-white text-black font-mono tracking-widest font-semibold
              hover:bg-gray-200 transition
            "
          >
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </Button>
        </div>
      </Card>
    </DashboardShell>
  );
}
