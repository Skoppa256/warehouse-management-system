"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function OutboundListPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api("/shipment");
    setShipments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function statusColor(status: string) {
    switch (status) {
      case "DRAFT":
        return "default";
      case "PENDING":
        return "warning";
      case "IN_TRANSIT":
        return "warning";
      case "DELIVERED":
        return "success";
      case "CANCELLED":
        return "danger";
      default:
        return "default";
    }
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Outbound Shipments</h1>

        {/* FIXED → Should go to shipment creation page, not list */}
        <Button onClick={() => router.push("/shipments/create")}>
          Create Shipment
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : shipments.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No shipments found.</p>
      ) : (
        <div className="grid gap-4">
          {shipments.map((ship) => (
            <Card
              key={ship.id}
              className="p-4 border border-[#1c1d22] bg-[#15171e] cursor-pointer hover:bg-[#181a22] transition"
              onClick={() => router.push(`/shipments/${ship.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{ship.shipmentNumber}</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Sales Order: {ship.salesOrder.orderNumber}
                  </p>
                </div>

                <Badge color={statusColor(ship.status)}>{ship.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
