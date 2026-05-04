"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/auth";
import DashboardShell from "@/components/layout/dashboard-shell";
import Badge from "@/components/ui/badge";
import { api } from "@/lib/api";

import {
  PackageSearch,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  Boxes,
} from "lucide-react";

export default function DashboardPage() {
  const ready = useAuthGuard();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<any>({});
  const [recent, setRecent] = useState<any[]>([]);
  const [reportStats, setReportStats] = useState<any>({
    lowStock: 0,
    expiringSoon: 0,
    productCount: 0,
  });

  useEffect(() => {
    if (!ready) return;

    async function load() {
      try {
        const dashboard = await api("/reports/dashboard");

        const low = await api("/reports/low-stock");
        const exp = await api("/reports/expiry");
        const prod = await api("/reports/products");

        const movements = await api(
          "/reports/stock-movement?page=1&pageSize=5"
        );

        setStats(dashboard ?? {});

        setRecent(Array.isArray(movements?.data) ? movements.data : []);

        setReportStats({
          lowStock: low?.data?.length ?? 0,
          expiringSoon: exp?.data?.length ?? 0,
          productCount: prod?.data?.length ?? 0,
        });
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ready]);

  if (!ready) return null;

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-gray-500 font-mono tracking-wide">
          Loading dashboard...
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      {/* PAGE TITLE */}
      <h1 className="text-lg font-mono tracking-widest text-white/90 mb-6">
        DASHBOARD OVERVIEW
      </h1>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="PRODUCTS"
          value={stats.totalProducts ?? 0}
          icon={<PackageSearch size={18} className="opacity-60" />}
        />

        <StatCard
          label="SUPPLIERS"
          value={stats.totalSuppliers ?? 0}
          icon={<Users size={18} className="opacity-60" />}
        />

        <StatCard
          label="CUSTOMERS"
          value={stats.totalCustomers ?? 0}
          icon={<TrendingUp size={18} className="opacity-60" />}
        />

        <StatCard
          label="LOW STOCK"
          value={reportStats.lowStock ?? 0}
          icon={<AlertTriangle size={18} className="text-red-400" />}
          valueClass="text-red-400"
        />
      </div>

      {/* REPORT SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <ReportCard
          title="LOW STOCK REPORT"
          value={reportStats.lowStock}
          link="/reports/low-stock"
          icon={<AlertTriangle className="text-red-300" size={20} />}
        />

        <ReportCard
          title="EXPIRY REPORT"
          value={reportStats.expiringSoon}
          link="/reports/expiry"
          icon={<Clock className="text-yellow-300" size={20} />}
        />

        <ReportCard
          title="BATCH / LOCATION REPORT"
          value={reportStats.productCount}
          link="/reports/batches"
          icon={<Boxes className="text-blue-300" size={20} />}
        />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-[#111215] border border-[#1e1f22] rounded-xl p-6 shadow-lg">
        <p className="text-sm font-mono tracking-widest text-white/70 mb-4">
          RECENT STOCK MOVEMENTS
        </p>

        {recent.length === 0 ? (
          <p className="text-xs text-gray-500 font-mono">No activity found.</p>
        ) : (
          <div className="space-y-4">
            {recent.map((move, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between pb-3 border-b border-[#1c1d22]"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {move.product?.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    Qty: {move.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge color={move.type === "IN" ? "success" : "danger"}>
                    {move.type}
                  </Badge>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(move.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  icon,
  valueClass = "text-white",
}: any) {
  return (
    <div
      className="
      bg-[#111215] border border-[#1e1f22]
      rounded-xl p-5 shadow-lg flex flex-col gap-3
    "
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-gray-400 tracking-widest">
          {label}
        </p>
        {icon}
      </div>

      <p className={`text-3xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function ReportCard({ title, value, link, icon }: any) {
  return (
    <a
      href={link}
      className="
        bg-[#111215] border border-[#1e1f22]
        rounded-xl p-5 shadow-lg flex flex-col gap-3
        hover:bg-[#15161a] transition-all cursor-pointer
      "
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-gray-400 tracking-widest">
          {title}
        </p>
        {icon}
      </div>

      <p className="text-2xl font-semibold text-white">{value}</p>

      <span className="text-[10px] text-gray-500 font-mono mt-1">
        View full report →
      </span>
    </a>
  );
}
