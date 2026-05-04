"use client";

import DashboardShell from "@/components/layout/dashboard-shell";
import Link from "next/link";
import {
  BarChart2,
  TrendingUp,
  Layers,
  AlertTriangle,
} from "lucide-react";

export default function ReportsIndexPage() {
  const items = [
    {
      title: "Low Stock Report",
      desc: "View items below threshold & stock discrepancies.",
      href: "/reports/low-stock",
      icon: <AlertTriangle className="text-red-400" size={22} />,
    },
    {
      title: "Expiry Report",
      desc: "Track batches nearing expiry & manage freshness.",
      href: "/reports/expiry",
      icon: <TrendingUp className="text-purple-400" size={22} />,
    },
    {
      title: "Batch / Location Report",
      desc: "See all batches and their distribution across locations.",
      href: "/reports/batches",
      icon: <Layers className="text-blue-400" size={22} />,
    },
    {
      title: "Stock Movement Report",
      desc: "Analyze warehouse movement trends and activity.",
      href: "/reports/stock-movement",
      icon: <BarChart2 className="text-teal-400" size={22} />,
    },
  ];

  return (
    <DashboardShell>
      <h1 className="text-lg font-mono tracking-widest text-white/90 mb-6">
        REPORTS CENTER
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, i) => (
          <Link key={i} href={item.href}>
            <div
              className="
                bg-[#111215] border border-[#1e1f22]
                rounded-xl p-6 shadow-lg cursor-pointer
                transition-all hover:shadow-xl hover:bg-[#15161a]
              "
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-mono tracking-widest text-gray-300">
                  {item.title.toUpperCase()}
                </p>
                {item.icon}
              </div>

              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
