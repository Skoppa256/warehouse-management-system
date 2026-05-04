"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
import TransferModal from "./transfer-modal";

export default function InventoryPage() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInv, setSelectedInv] = useState<any | null>(null);

  async function loadInventory() {
    try {
      const data = await api("/inventory");   // Backend already grouped
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Inventory API error:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadInventory();
  }, []);

  // ---------------------------------------------------------
  // FILTER & SORT (no grouping here!)
  // ---------------------------------------------------------
  const filtered = items
    .filter((inv) => {
      const text =
        (inv.product?.name || "") +
        (inv.product?.sku || "") +
        (inv.batch?.code || "") +
        (inv.location?.code || "");
      return text.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const prodA = a.product?.name || "";
      const prodB = b.product?.name || "";
      if (prodA !== prodB) return prodA.localeCompare(prodB);

      const skuA = a.product?.sku || "";
      const skuB = b.product?.sku || "";
      if (skuA !== skuB) return skuA.localeCompare(skuB);

      const batchA = a.batch?.code || "";
      const batchB = b.batch?.code || "";
      if (batchA !== batchB) return batchA.localeCompare(batchB);

      const locA = a.location?.code || "";
      const locB = b.location?.code || "";
      return locA.localeCompare(locB);
    });

  return (
    <DashboardShell>
      <div className="space-y-10">

        {/* HEADER */}
        <div>
          <h1 className="text-xl font-mono tracking-widest text-white mb-1">
            INVENTORY
          </h1>
          <p className="text-xs font-mono text-gray-500 tracking-widest">
            REAL-TIME STOCK VISIBILITY
          </p>
        </div>

        {/* SEARCH */}
        <div className="flex gap-3 items-center">
          <input
            placeholder="Search product, SKU, batch, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full px-3 py-2 rounded-lg
              bg-[#0d0e10] border border-[#1c1d22]
              text-sm font-mono tracking-wide
              outline-none focus:border-white
            "
          />
        </div>

        {/* TABLE */}
        <Card className="bg-[#0e0f12] border border-[#1c1d22] rounded-xl overflow-hidden p-0">
          <table className="w-full text-sm font-mono tracking-wide">

            <thead className="bg-[#111217] text-gray-500 text-[11px] uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Batch</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Reserved</th>
                <th className="px-4 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>

              {/* LOADING */}
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500 text-xs">
                    LOADING INVENTORY...
                  </td>
                </tr>
              )}

              {/* EMPTY */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500 text-xs">
                    NO INVENTORY FOUND.
                  </td>
                </tr>
              )}

              {/* DATA ROWS */}
              {!loading &&
                filtered.map((inv) => {
                  const available = inv.quantity - inv.reservedQty;
                  const low = available <= (inv.product?.lowStockThreshold || 0);

                  return (
                    <tr
                      key={inv.id}
                      className="border-t border-[#1c1d22] hover:bg-[#15161b] transition"
                    >
                      <td
                        className="px-4 py-3 font-semibold cursor-pointer"
                        onClick={() => router.push(`/inventory/${inv.id}`)}
                      >
                        {inv.product?.name}
                      </td>

                      <td
                        className="px-4 py-3 text-gray-500 cursor-pointer"
                        onClick={() => router.push(`/inventory/${inv.id}`)}
                      >
                        {inv.product?.sku}
                      </td>

                      <td className="px-4 py-3">{inv.batch?.code || "—"}</td>

                      <td className="px-4 py-3">{inv.location?.code || "—"}</td>

                      <td className="px-4 py-3 text-right font-bold">
                        {inv.quantity}
                      </td>

                      <td className="px-4 py-3 text-right text-gray-400">
                        {inv.reservedQty}
                      </td>

                      <td
                        className={
                          "px-4 py-3 text-right font-bold " +
                          (low ? "text-red-400" : "text-green-400")
                        }
                      >
                        {available}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setSelectedInv(inv)}
                            className="
                              px-4 py-2 rounded-lg bg-white text-black 
                              font-mono text-[10px] tracking-widest font-semibold
                              hover:bg-gray-200 transition
                              flex items-center gap-2
                            "
                          >
                            <Repeat size={12} className="text-black" />
                            TRANSFER
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* TRANSFER MODAL */}
      {selectedInv && (
        <TransferModal
          inv={selectedInv}
          onClose={() => setSelectedInv(null)}
          onSuccess={() => {
            setSelectedInv(null);
            loadInventory();
          }}
        />
      )}
    </DashboardShell>
  );
}
