export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  uom: string;
  imagePath?: string;
  lowStockThreshold: number;
}
