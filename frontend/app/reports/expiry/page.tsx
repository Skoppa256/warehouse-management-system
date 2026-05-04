"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ExpiryRow {
  productName: string;
  batchNumber: string;
  locationCode: string;
  quantity: number;
  expiryDate: string;
}

interface ExpiryChartPoint {
  key: string;      
  label: string;    
  date: Date;       
  count: number;
}

export default function ExpiryReportPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExpiryRow[]>([]);
  const [chartData, setChartData] = useState<ExpiryChartPoint[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api("/reports/expiry");
        const data: ExpiryRow[] = res.data || [];
        setRows(data);

        // --- GROUP BY MONTH–YEAR ---
        const grouped: Record<string, ExpiryChartPoint> = {};

        data.forEach((row) => {
          const d = new Date(row.expiryDate);
          const year = d.getFullYear();
          const monthIndex = d.getMonth(); // 0–11
          const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

          if (!grouped[key]) {
            grouped[key] = {
              key,
              label: d.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              }),
              date: new Date(year, monthIndex, 1),
              count: 0,
            };
          }
          grouped[key].count += 1;
        });

        const points = Object.values(grouped).sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );

        setChartData(points);
      } catch (err) {
        console.error("Failed to load expiry report:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <DashboardShell>
      <h1 className="text-lg font-mono tracking-widest text-white/90 mb-6">
        EXPIRY REPORT
      </h1>

      {/* CHART */}
      <div className="bg-[#111215] border border-[#1e1f22] rounded-xl p-6 shadow-lg mb-8">
        <p className="font-mono text-xs text-gray-400 tracking-widest mb-4">
          EXPIRY TREND (MONTH–YEAR)
        </p>

        <div className="w-full h-[280px]">
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500 font-mono">
              {loading ? "Loading chart..." : "No expiry data available."}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="expiryColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#9b6bff" stopOpacity={0.8} />
                    <stop offset="90%" stopColor="#9b6bff" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* use the month-year label */}
                <XAxis dataKey="label" stroke="#777" />
                <YAxis stroke="#555" />

                <Tooltip
                  contentStyle={{
                    background: "#111215",
                    border: "1px solid #1e1f22",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`${value}`, "count"]}
                  labelFormatter={(label: any) => `${label}`}
                />

                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#b388ff"
                  fill="url(#expiryColor)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
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
                      {new Date(row.expiryDate).toLocaleDateString()}
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
