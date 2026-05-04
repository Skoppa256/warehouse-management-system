"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Boxes } from "lucide-react";

export default function LocationDetailPage() {
  const router = useRouter();
  const { sectionId, locationId } = useParams();

  const [location, setLocation] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLocation() {
    try {
      const res = await api(`/sections/${sectionId}/locations/${locationId}`);
      setLocation(res);
    } catch (err) {
      console.error("Location fetch failed:", err);
    }
  }

  async function loadInventory() {
    try {
      const all = await api("/inventory");

      const filtered = all.filter(
        (inv: any) => inv.location?.id === locationId
      );

      setInventory(filtered);
    } catch (err) {
      console.error("Inventory filter failed:", err);
      setInventory([]);
    }
  }

  async function deleteLocation() {
    if (!confirm("DELETE THIS LOCATION?")) return;

    await api(`/sections/${sectionId}/locations/${locationId}`, {
      method: "DELETE",
    });

    router.push(`/sections/${sectionId}`);
  }

  useEffect(() => {
    Promise.all([loadLocation(), loadInventory()]).finally(() =>
      setLoading(false)
    );
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-xs font-mono text-gray-500">LOADING LOCATION...</p>
      </DashboardShell>
    );
  }

  if (!location) {
    return (
      <DashboardShell>
        <p className="text-sm font-mono text-red-400">LOCATION NOT FOUND.</p>
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
              className="p-2 hover:bg-[#1a1c20] rounded-lg transition"
              onClick={() => router.push(`/sections/${sectionId}`)}
            >
              <ArrowLeft size={20} className="text-gray-300" />
            </button>

            <h1 className="text-xl font-mono tracking-widest text-white">
              {location.code.toUpperCase()}
            </h1>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3">
            <button
              onClick={() =>
                router.push(
                  `/sections/${sectionId}/locations/${locationId}/edit`
                )
              }
              className="
                px-4 py-2 rounded-lg bg-white text-black 
                font-mono text-xs tracking-widest
                hover:bg-gray-200 transition flex items-center gap-2
              "
            >
              <Pencil size={14} /> EDIT
            </button>

            <button
              onClick={deleteLocation}
              className="
                px-4 py-2 rounded-lg border border-red-500 text-red-400 
                font-mono text-xs tracking-widest hover:bg-red-500/20
                transition flex items-center gap-2
              "
            >
              <Trash2 size={14} /> DELETE
            </button>
          </div>
        </div>

        {/* DETAILS CARD */}
        <Card className="p-8 bg-[#111217] border border-[#1c1d22] rounded-xl">
          <h2 className="text-sm font-mono tracking-widest text-gray-400 mb-6">
            LOCATION DETAILS
          </h2>

          <div className="space-y-4 text-sm">
            <Detail label="CODE" value={location.code} />
            <Detail label="TYPE" value={location.type} />
          </div>
        </Card>

        {/* INVENTORY LIST */}
        <Card className="p-8 bg-[#111217] border border-[#1c1d22] rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <Boxes className="text-[var(--accent)] w-5 h-5" />
            <h2 className="text-sm font-mono tracking-widest text-gray-400">
              PRODUCTS STORED HERE
            </h2>
          </div>

          {inventory.length === 0 ? (
            <p className="text-xs font-mono text-gray-500">
              NO PRODUCTS IN THIS LOCATION.
            </p>
          ) : (
            <table className="w-full text-sm font-mono tracking-wide">
              <thead className="bg-[#0e0f12] text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] tracking-widest">
                    PRODUCT
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] tracking-widest">
                    BATCH
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] tracking-widest">
                    QTY
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] tracking-widest">
                    RESERVED
                  </th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-[#1c1d22] hover:bg-[#131419] transition"
                  >
                    <td className="px-4 py-3">{inv.product?.name}</td>
                    <td className="px-4 py-3">{inv.batch?.code ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {inv.quantity} {inv.product?.uom}
                    </td>
                    <td className="px-4 py-3 text-right">{inv.reservedQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

function Detail({ label, value }: any) {
  return (
    <div className="flex justify-between border-b border-[#232428] pb-2">
      <span className="text-[11px] text-gray-500 font-mono tracking-widest">
        {label}
      </span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
