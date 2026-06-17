"use client";

import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { useApi } from "@/lib/use-api";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import LoadingState from "@/components/ui/loading-state";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";
import { useRole } from "@/lib/roles";

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useRole();
  const { data, loading, error, refetch } = useApi<any>("/products");
  const products = Array.isArray(data) ? data : [];

  async function deleteProduct(name: string, id: string) {
    const ok = await confirm({
      title: `Delete ${name}?`,
      description: "This removes the product from your records. This can't be undone.",
      confirmLabel: "Delete product",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await api(`/products/${id}`, { method: "DELETE" });
      toast.success("Product deleted.");
      refetch();
    } catch {
      toast.error("Couldn't delete the product. Try again.");
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Products
          </h1>

          {can("manage:masterData") && (
            <Button
              variant="primary"
              onClick={() => router.push("/products/create")}
            >
              <Plus size={16} /> Add product
            </Button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Loading products…" />
        ) : error ? (
          <ErrorState message="Couldn't load products. Refresh the page to try again." />
        ) : products.length === 0 ? (
          <EmptyState message="No products yet. Use the Add product button to create one." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <Card
                key={p.id}
                className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer flex flex-col justify-between"
              >
                {/* Clickable content */}
                <div
                  className="flex flex-col flex-grow"
                  onClick={() => router.push(`/products/${p.id}`)}
                >
                  {/* Image */}
                  {p.imagePath ? (
                    <img
                      src={`${API_BASE_URL}${p.imagePath}`}
                      alt={p.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-32 bg-[var(--muted)] rounded-lg mb-4 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
                      No image
                    </div>
                  )}

                  {/* Info */}
                  <div className="space-y-1">
                    <p className="font-semibold text-lg text-[var(--foreground)]">{p.name}</p>

                    <p className="text-sm text-[var(--muted-foreground)]">
                      SKU: {p.sku}
                    </p>

                    <p className="text-sm text-[var(--muted-foreground)]">
                      Category: {p.category}
                    </p>

                    {p.brand && (
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Brand: {p.brand}
                      </p>
                    )}

                    <p className="text-sm text-[var(--muted-foreground)]">
                      UOM: {p.uom}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-4">
                  {can("manage:masterData") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/products/${p.id}/edit`);
                      }}
                    >
                      <Pencil size={16} /> Edit
                    </Button>
                  )}

                  {can("manage:masterData") && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(p.name, p.id);
                      }}
                    >
                      <Trash2 size={16} /> Delete
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
