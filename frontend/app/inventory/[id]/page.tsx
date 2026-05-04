"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

type MovementType = "INBOUND" | "OUTBOUND" | "TRANSFER" | "ADJUST";

export default function InventoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [inv, setInv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [movements, setMovements] = useState<any[]>([]);
  const [movementLoading, setMovementLoading] = useState(true);

  async function loadInventory() {
    try {
      const data = await api(`/inventory/${id}`);
      setInv(data);
    } catch (err) {
      console.error("Inventory fetch failed:", err);
    }
    setLoading(false);
  }

  async function loadMovements() {
    try {
      const data = await api(`/inventory/${id}/movements`);
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Movement fetch failed:", err);
    }
    setMovementLoading(false);
  }

  useEffect(() => {
    loadInventory();
    loadMovements();
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-xs text-gray-500 font-mono tracking-widest">
          LOADING INVENTORY...
        </p>
      </DashboardShell>
    );
  }

  if (!inv) {
    return (
      <DashboardShell>
        <p className="text-xs text-red-400 font-mono tracking-widest">
          INVENTORY NOT FOUND.
        </p>
      </DashboardShell>
    );
  }

  // BADGE MAP (Static)
  const badgeMap: Record<MovementType, { text: string; color: string }> = {
    INBOUND: { text: "IN", color: "bg-green-900/40 text-green-300" },
    OUTBOUND: { text: "OUT", color: "bg-red-900/40 text-red-300" },
    TRANSFER: { text: "MOVE", color: "bg-blue-900/40 text-blue-300" },
    ADJUST: { text: "ADJ", color: "bg-yellow-900/40 text-yellow-300" },
  };

  return (
    <DashboardShell>
      <div className="space-y-10">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 hover:bg-[#1a1c20] rounded-lg transition"
            onClick={() => router.push("/inventory")}
          >
            <ArrowLeft size={20} className="text-gray-300" />
          </button>

          <h1 className="text-xl font-mono tracking-widest">
            {inv.product?.name?.toUpperCase()} — INVENTORY
          </h1>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* PRODUCT INFO CARD */}
          <Card className="p-8 bg-[#111217] border border-[#1c1d22] rounded-xl">
            <h2 className="text-sm font-mono tracking-widest text-gray-400 mb-6">
              PRODUCT DETAILS
            </h2>

            <div className="space-y-4 text-sm">
              <DetailRow label="NAME" value={inv.product?.name} />
              <DetailRow label="SKU" value={inv.product?.sku} />
              <DetailRow label="CATEGORY" value={inv.product?.category} />
              <DetailRow label="UOM" value={inv.product?.uom} />
            </div>
          </Card>

          {/* INVENTORY DETAILS CARD */}
          <Card className="p-8 bg-[#111217] border border-[#1c1d22] rounded-xl lg:col-span-2">
            <h2 className="text-sm font-mono tracking-widest text-gray-400 mb-6">
              INVENTORY DETAILS
            </h2>

            <div className="space-y-4 text-sm">
              <DetailRow label="BATCH" value={inv.batch?.code || "—"} />
              <DetailRow label="LOCATION" value={inv.location?.code || "—"} />
              <DetailRow label="QUANTITY" value={inv.quantity} />
              <DetailRow label="RESERVED" value={inv.reservedQty} />
              <DetailRow
                label="AVAILABLE"
                value={inv.quantity - inv.reservedQty}
              />
            </div>
          </Card>
        </div>

        {/* MOVEMENT HISTORY */}
        <Card className="p-8 bg-[#111217] border border-[#1c1d22] rounded-xl">
          <h2 className="text-sm font-mono tracking-widest text-gray-400 mb-6">
            MOVEMENT HISTORY
          </h2>

          {movementLoading ? (
            <p className="text-xs text-gray-500 font-mono tracking-widest">
              Loading movements...
            </p>
          ) : movements.length === 0 ? (
            <p className="text-xs text-gray-500 font-mono tracking-widest">
              No movement history for this item.
            </p>
          ) : (
            <div className="space-y-4">
              {movements.map(
                (m: { type: MovementType; quantity: number; [key: string]: any }) => {
                  
                  const badge =
                    badgeMap[m.type as MovementType] ??
                    {
                      text: m.type || "UNKNOWN",
                      color: "bg-gray-800 text-gray-300",
                    };


                  const qtyColor =
                    m.type === "INBOUND"
                      ? "text-green-400"
                      : m.type === "OUTBOUND"
                      ? "text-red-400"
                      : "text-blue-400";

                  const qtyPrefix =
                    m.type === "INBOUND" ? "+" :
                    m.type === "OUTBOUND" ? "-" : "";

                  const referenceLabel =
                    m.referenceType === "PO"
                      ? m.purchaseOrder?.orderNumber
                      : m.referenceType === "SO"
                      ? m.salesOrder?.orderNumber
                      : null;

                  return (
                    <div
                      key={m.id}
                      className="p-4 bg-[#0f1014] border border-[#1d1e23] rounded-lg"
                    >
                      <div className="flex justify-between items-start">

                        {/* LEFT SECTION */}
                        <div className="space-y-1 text-xs">

                          {/* BADGE + TITLE */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-[2px] rounded-md text-[10px] font-bold ${badge.color}`}
                            >
                              {badge.text}
                            </span>

                            <span className="font-semibold text-gray-200">
                              {m.type === "INBOUND" && "Inbound (PO Receipt)"}
                              {m.type === "OUTBOUND" && "Outbound (Sales Shipment)"}
                              {m.type === "TRANSFER" && "Transfer Between Locations"}
                              {m.type === "ADJUST" && "Stock Adjustment"}
                            </span>
                          </div>

                          {/* QUANTITY */}
                          <div className={`font-bold ${qtyColor}`}>
                            {qtyPrefix}{m.quantity}
                          </div>

                          {/* REFERENCE */}
                          {referenceLabel && (
                            <div className="text-gray-400">
                              Ref: {referenceLabel}
                            </div>
                          )}

                          {/* TRANSFER ROUTE */}
                          {m.type === "TRANSFER" && (
                            <div className="text-gray-400">
                              {m.fromLocation?.code || "?"} → {m.toLocation?.code || "?"}
                            </div>
                          )}

                          {/* TIME */}
                          <div className="text-gray-500 text-[10px]">
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* RIGHT SECTION: USER */}
                        <div className="text-right text-[10px] text-gray-500">
                          {m.user?.name || "System"}
                        </div>

                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </Card>

      </div>
    </DashboardShell>
  );
}

/* DETAIL ROW COMPONENT */
function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center border-b border-[#232428] pb-3">
      <span className="text-[11px] text-gray-500 font-mono tracking-widest">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
