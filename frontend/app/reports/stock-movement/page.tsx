"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StockMovementReportPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await api("/reports/stock-movement");
      setRows(res.data || []);

      // group by date
      const group: any = {};
      res.data.forEach((row: any) => {
        const d = new Date(row.createdAt).toLocaleDateString();
        group[d] = (group[d] || 0) + 1;
      });

      setChartData(
        Object.entries(group).map(([date, count]) => ({
          date,
          count,
        }))
      );

      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardShell>
      <h1 className="text-lg font-mono tracking-widest text-white/90 mb-6">
        STOCK MOVEMENT REPORT
      </h1>

      {/* CHART */}
      <div className="bg-[#111215] border border-[#1e1f22] rounded-xl p-6 shadow-lg mb-8">
        <p className="font-mono text-xs text-gray-400 tracking-widest mb-4">
          MOVEMENT TREND
        </p>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#777" />
              <YAxis stroke="#555" />

              <Tooltip
                contentStyle={{
                  background: "#111215",
                  border: "1px solid #1e1f22",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />

              <Line
                type="monotone"
                dataKey="count"
                stroke="#4fe0c0"
                strokeWidth={2}
                dot={{ fill: "#4fe0c0" }}
              />
            </LineChart>
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
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">From</th>
                  <th className="px-4 py-3 text-left">To</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>

              <tbody className="text-sm text-gray-300 font-mono divide-y divide-[#1e1f22]">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-[#15161a] transition-all">
                    <td className="px-4 py-3">{row.product?.name}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3">{row.fromLocation?.code || "-"}</td>
                    <td className="px-4 py-3">{row.toLocation?.code || "-"}</td>
                    <td className="px-4 py-3 text-right">{row.quantity}</td>
                    <td className="px-4 py-3">
                      {new Date(row.createdAt).toLocaleString()}
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
