"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from "recharts";

export default function BatchReportPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await api("/reports/batches");
      setRows(res.data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardShell>
      <h1 className="text-lg font-mono tracking-widest text-white/90 mb-6">
        BATCH / LOCATION REPORT
      </h1>

      {/* CHART */}
      <div className="bg-[#111215] border border-[#1e1f22] rounded-xl p-6 shadow-lg mb-8">
        <p className="font-mono text-xs text-gray-400 tracking-widest mb-4">
          BATCH QUANTITY
        </p>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows.slice(0, 15)}>
              <XAxis dataKey="batchNumber" stroke="#666" />
              <YAxis stroke="#444" />

              <Tooltip
                contentStyle={{
                  background: "#111215",
                  border: "1px solid #1e1f22",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />

              <Bar dataKey="quantity" fill="#4f8cff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#111215] border border-[#1e1f22] rounded-xl p-6 shadow-lg">
        {loading ? (
          <p className="text-sm text-gray-500 font-mono">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-xl overflow-hidden">
              <thead className="bg-[#1e1f22] text-gray-400 font-mono text-[10px] tracking-widest uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Batch</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                </tr>
              </thead>

              <tbody className="text-sm text-gray-300 font-mono divide-y divide-[#1e1f22]">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-[#15161a] transition-all">
                    <td className="px-4 py-3">{row.productName}</td>
                    <td className="px-4 py-3">{row.batchNumber}</td>
                    <td className="px-4 py-3">{row.locationCode}</td>
                    <td className="px-4 py-3 text-right">{row.quantity}</td>
                    <td className="px-4 py-3">
                      {row.expiryDate
                        ? new Date(row.expiryDate).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
