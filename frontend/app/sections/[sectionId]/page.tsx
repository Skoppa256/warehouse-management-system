"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function SectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sectionId = params?.sectionId as string;

  const [section, setSection] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const secRes = await api(`/sections/${sectionId}`);
      const sec = secRes.section ?? secRes;
      setSection(sec);

      const locRes = await api(`/sections/${sectionId}/locations?page=1&limit=999`);
      const locList = Array.isArray(locRes) ? locRes : locRes.data ?? [];
      setLocations(locList);
    } catch (err) {
      console.error("Section detail failed:", err);
    }
    setLoading(false);
  }

  async function deleteSection() {
    if (!confirm("Delete this section? Locations may prevent deletion.")) return;

    try {
      await api(`/sections/${sectionId}`, { method: "DELETE" });
      router.push("/sections");
    } catch (err) {
      console.error(err);
      alert("Cannot delete section. Ensure no locations exist.");
    }
  }

  useEffect(() => {
    loadData();
  }, [sectionId]);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-gray-500 font-mono">LOADING SECTION...</p>
      </DashboardShell>
    );
  }

  if (!section) {
    return (
      <DashboardShell>
        <p className="text-sm text-red-500 font-mono">SECTION NOT FOUND.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/sections")}
              className="p-2 hover:bg-[#1a1b1f] rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-col">
              <h1 className="text-xl font-mono tracking-widest">{section.code}</h1>
              <span className="text-xs text-gray-400 font-mono tracking-widest">
                {section.description || "NO DESCRIPTION"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* EDIT */}
            <button
              onClick={() => router.push(`/sections/${sectionId}/edit`)}
              className="
                px-4 py-2 rounded-lg bg-white text-black 
                font-mono text-xs tracking-widest font-semibold
                hover:bg-gray-200 transition flex items-center gap-2
              "
            >
              <Pencil size={14} /> EDIT
            </button>

            {/* DELETE */}
            <button
              onClick={deleteSection}
              className="
                px-4 py-2 rounded-lg bg-red-600 text-white 
                font-mono text-xs tracking-widest font-semibold
                hover:bg-red-500 transition flex items-center gap-2
              "
            >
              <Trash2 size={14} /> DELETE
            </button>
          </div>
        </div>

        {/* DETAILS CARD */}
        <Card className="p-6 bg-[#111217] border border-[#1c1d22] rounded-xl">
          <h2 className="text-lg font-semibold mb-4 font-mono tracking-widest">
            SECTION DETAILS
          </h2>

          <div className="space-y-4 text-sm font-mono">
            <DetailItem label="CODE" value={section.code} />
            <DetailItem
              label="DESCRIPTION"
              value={section.description || "—"}
            />
            <DetailItem
              label="TOTAL LOCATIONS"
              value={String(locations.length)}
            />
          </div>
        </Card>

        {/* LOCATIONS HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-mono tracking-widest">LOCATIONS</h2>

          <button
            onClick={() =>
              router.push(`/sections/${sectionId}/locations/create`)
            }
            className="
              px-4 py-2 rounded-lg bg-white text-black 
              font-mono text-xs tracking-widest font-semibold
              hover:bg-gray-200 transition flex items-center gap-2
            "
          >
            <Plus size={14} /> ADD LOCATION
          </button>
        </div>

        {/* LOCATION TABLE */}
        <Card className="p-0 bg-[#111217] border border-[#1c1d22] rounded-xl overflow-hidden">
          <table className="w-full text-sm font-mono tracking-wider">
            <thead className="bg-[#0e0f12] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] tracking-widest">
                  CODE
                </th>
                <th className="px-4 py-3 text-left text-[10px] tracking-widest">
                  TYPE
                </th>
              </tr>
            </thead>

            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-4 text-center text-gray-500 text-xs"
                  >
                    NO LOCATIONS FOUND.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr
                    key={loc.id}
                    className="
                      border-t border-[#1c1d22]
                      hover:bg-[#131419] transition cursor-pointer
                    "
                    onClick={() =>
                      router.push(`/sections/${sectionId}/locations/${loc.id}`)
                    }
                  >
                    {/* CODE */}
                    <td className="px-4 py-3 text-white font-semibold">
                      {loc.code}
                    </td>

                    {/* TYPE */}
                    <td className="px-4 py-3 text-gray-300">
                      {loc.type}
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3 text-right">
                      <ArrowRight
                        size={16}
                        className="text-gray-400 hover:text-white transition"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

      </div>
    </DashboardShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[#232428] pb-2">
      <span className="text-gray-500 text-[10px] tracking-widest">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
