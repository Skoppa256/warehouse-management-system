"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Package, Truck, CheckCircle2, XCircle } from "lucide-react";

export default function OutboundDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [shipment, setShipment] = useState<any>(null);
  const [salesOrder, setSalesOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [qty, setQty] = useState(1);

  async function load() {
    const sh = await api(`/shipment/${id}`);
    setShipment(sh);

    const so = await api(`/sales-order/${sh.salesOrderId}`);
    setSalesOrder(so);

    const mapped = so.items.map((it: any) => {
      const shipped = sh.lines
        .filter((l: any) => l.salesOrderItemId === it.id)
        .reduce((sum, x) => sum + x.quantity, 0);

      return { ...it, shippedQty: shipped };
    });

    setItems(mapped);
  }

  useEffect(() => {
    load();
  }, []);

  async function addLine() {
    if (!selectedItem) return alert("Select item.");
    if (qty <= 0) return alert("Quantity must be > 0");

    await api(`/shipment/${id}/line`, {
      method: "POST",
      body: JSON.stringify({
        salesOrderItemId: selectedItem,
        quantity: qty,
      }),
    });

    await load();
    setQty(1);
  }

  async function ship() {
    await api(`/shipment/${id}/ship`, { method: "POST" });
    await load();
  }

  async function deliver() {
    await api(`/shipment/${id}/deliver`, { method: "POST" });
    await load();
  }

  async function cancel() {
    if (!confirm("Cancel this shipment?")) return;
    await api(`/shipment/${id}/cancel`, { method: "POST" });
    router.push("/outbound");
  }

  if (!shipment || !salesOrder) return <DashboardShell>Loading...</DashboardShell>;

  const isDraft = shipment.status === "DRAFT" || shipment.status === "PENDING";
  const isInTransit = shipment.status === "IN_TRANSIT";

  function statusColor(s: string) {
    switch (s) {
      case "DRAFT": return "default";
      case "PENDING": return "warning";
      case "IN_TRANSIT": return "warning";
      case "DELIVERED": return "success";
      case "CANCELLED": return "danger";
      default: return "default";
    }
  }

  return (
    <DashboardShell>
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button
          className="p-2 hover:bg-[#1a1b1f] rounded-lg"
          onClick={() => router.push("/outbound")}
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1 className="text-2xl font-semibold">{shipment.shipmentNumber}</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Sales Order: {salesOrder.orderNumber}
          </p>
        </div>
      </div>

      {/* STATUS CARD */}
      <Card className="p-4 mb-6 border border-[#1c1d22] bg-[#15171e]">
        <p className="text-sm flex items-center gap-2">
          Status: <Badge color={statusColor(shipment.status)}>{shipment.status}</Badge>
        </p>

        <div className="mt-4 flex gap-3">
          {isDraft && (
            <>
              <Button onClick={ship} className="flex gap-2">
                <Truck size={16} /> Ship
              </Button>

              <Button variant="destructive" onClick={cancel}
                className="flex gap-2">
                <XCircle size={16} /> Cancel
              </Button>
            </>
          )}

          {isInTransit && (
            <Button
              onClick={deliver}
              className="flex gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 size={16} /> Deliver
            </Button>
          )}
        </div>
      </Card>

      {/* ADD LINE */}
      {isDraft && (
        <Card className="p-5 mb-6 bg-[#15171e] border border-[#1c1d22]">
          <h2 className="font-semibold mb-4">Add Shipment Line</h2>

          <label className="text-sm">Item</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full mb-4 bg-[#111217] border border-[#23252e] rounded px-3 py-2"
          >
            <option value="">-- Select Item --</option>
            {items.map((it) => {
              const remaining = it.quantity - it.shippedQty;
              if (remaining <= 0) return null;

              return (
                <option key={it.id} value={it.id}>
                  {it.product.name} — remain {remaining}
                </option>
              );
            })}
          </select>

          <label className="text-sm">Quantity</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full mb-4 bg-[#111217] border border-[#23252e] rounded px-3 py-2"
          />

          <Button onClick={addLine} className="flex gap-2">
            <Plus size={16} /> Add Line
          </Button>
        </Card>
      )}

      {/* LINES */}
      <Card className="p-4 border border-[#1c1d22] bg-[#15171e]">
        <h2 className="font-semibold mb-3">Shipment Lines</h2>

        {shipment.lines.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No lines yet.</p>
        ) : (
          shipment.lines.map((l: any) => (
            <div
              key={l.id}
              className="border border-[#23252e] rounded p-3 mb-2 text-sm"
            >
              <p>Product: {l.product.name}</p>
              <p>Qty: {l.quantity}</p>
              <p>Batch: {l.batch?.batchNumber}</p>
              <p>From: {l.fromLocation?.code}</p>
            </div>
          ))
        )}
      </Card>
    </DashboardShell>
  );
}
