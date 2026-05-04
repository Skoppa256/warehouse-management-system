"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function LowStockReportPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await api("/reports/low-stock");
      setRows(res.data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardShell>
      <h1 className="text-lg font-mono tracking-widest text-white/90 mb-6">
        LOW STOCK REPORT
      </h1>

      {/* CHART */}
      <div className="bg-[#111215] border border-[#1e1f22] rounded-xl p-6 shadow-lg mb-8">
        <p className="font-mono text-xs text-gray-400 tracking-widest mb-4">
          STOCK VS THRESHOLD
        </p>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows.slice(0, 12)}>
              <XAxis dataKey="sku" stroke="#666" />
              <YAxis stroke="#444" />
              <Tooltip
                contentStyle={{
                  background: "#111215",
                  border: "1px solid #1e1f22",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="totalStock" fill="#4f8cff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lowStockThreshold" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
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
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Threshold</th>
                  <th className="px-4 py-3 text-right">Diff</th>
                </tr>
              </thead>

              <tbody className="text-sm text-gray-300 font-mono divide-y divide-[#1e1f22]">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-[#15161a] transition-all">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.sku}</td>
                    <td className="px-4 py-3 text-right">{row.totalStock}</td>
                    <td className="px-4 py-3 text-right">{row.lowStockThreshold}</td>
                    <td
                      className={`px-4 py-3 text-right ${
                        row.difference < 0 ? "text-red-400" : "text-yellow-300"
                      }`}
                    >
                      {row.difference}
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
