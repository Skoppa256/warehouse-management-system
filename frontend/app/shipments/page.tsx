"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { api } from "@/lib/api";

import { ArrowRight, Plus } from "lucide-react";

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  createdAt: string;
  salesOrderId: string;
}

export default function ShipmentsPage() {
  const router = useRouter();
  const [list, setList] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api("/shipment");
      setList(res?.data ?? res ?? []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-8">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-mono tracking-widest text-white mb-1">
              SHIPMENTS
            </h1>
            <p className="text-xs font-mono text-gray-500 tracking-widest">
              OUTBOUND LOGISTICS
            </p>
          </div>

          {/* WHITE NEW SHIPMENT BUTTON */}
          <button
            onClick={() => router.push("/shipments/create")}
            className="
              bg-white text-black font-mono tracking-widest text-xs 
              px-4 py-2 rounded-lg flex items-center gap-2
              hover:bg-gray-200 transition
            "
          >
            <Plus size={14} className="text-black" />
            NEW SHIPMENT
          </button>
        </div>

        {/* TABLE */}
        <Card className="p-0 bg-[#0e0f12] border border-[#1c1d22] overflow-hidden">
          <table className="w-full text-sm font-mono tracking-wide">
            <thead className="bg-[#111217] text-gray-500 text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Shipment</th>
                <th className="px-5 py-3 text-left">Sales Order</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-6 text-center text-gray-500 text-xs"
                  >
                    LOADING SHIPMENTS...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-6 text-center text-gray-500 text-xs"
                  >
                    NO SHIPMENTS FOUND.
                  </td>
                </tr>
              ) : (
                list.map((s) => (
                  <tr
                    key={s.id}
                    className="
                      border-t border-[#1c1d22]
                      hover:bg-[#15161b] transition
                    "
                  >
                    {/* SHIPMENT NUMBER */}
                    <td
                      className="px-5 py-3 cursor-pointer font-semibold"
                      onClick={() => router.push(`/shipments/${s.id}`)}
                    >
                      {s.shipmentNumber}
                    </td>

                    {/* SALES ORDER ID */}
                    <td
                      className="px-5 py-3 cursor-pointer text-gray-300"
                      onClick={() => router.push(`/shipments/${s.id}`)}
                    >
                      {s.salesOrderId}
                    </td>

                    {/* STATUS */}
                    <td
                      className="px-5 py-3 cursor-pointer"
                      onClick={() => router.push(`/shipments/${s.id}`)}
                    >
                      <Badge>{s.status}</Badge>
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => router.push(`/shipments/${s.id}`)}
                        className="p-1 rounded hover:bg-[#1c1d22] transition"
                      >
                        <ArrowRight
                          size={18}
                          className="opacity-70 hover:opacity-100 transition"
                        />
                      </button>
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
