/**
 * Database seeder.
 *
 * Builds a full demo dataset — master data plus transactional history — so
 * every report and dashboard chart has real data points to draw:
 *
 *   - Sections + bin locations            (prereq for inventory & movements)
 *   - Product batches across many expiry   -> Expiry report (dots per month)
 *     months, incl. expired / near-expiry
 *   - Inventory placed into bins, with a    -> Low-stock report (bars) &
 *     few products kept below threshold        Batches & locations report
 *   - ~90 days of stock movements, several  -> Stock-movement report
 *     per day                                   (one dot per day)
 *   - Purchase / sales orders + shipments   -> Inbound / outbound / shipment
 *     so those list pages aren't empty           pages
 *   - A real product photo per product,     -> images downloaded into uploads/
 *     supplier and customer (curated from        and served at /uploads/<file>
 *     Wikimedia Commons)
 *
 * It is re-runnable: transactional tables are cleared first, master data is
 * upserted. Run with:  npm run seed
 *
 * The dataset is intentionally scoped to what schema.prisma models today:
 * products, batches, bins, inventory, movements and the inbound/outbound
 * order flow — no variants, serials, kitting, contracts or returns.
 *
 * Override behaviour with env vars:
 *   SEED_DAYS              number of days of movement history (default 90)
 *   SEED_PER_DAY_MAX       max movements per day              (default 4)
 *   SEED_SKIP_IMAGES       set "true" to skip image downloads (offline / faster)
 *   SEED_IMAGE_REFRESH     set "true" to re-download cached seed images
 *   SEED_IMAGE_TIMEOUT_MS  per-image download timeout         (default 5000)
 */
import {
  PrismaClient,
  UserRole,
  UOM,
  MovementType,
  LocationType,
  ReferenceType,
  OrderStatus,
  SalesOrderStatus,
  ShipmentStatus,
  GoodsReceiptStatus,
  User,
  Supplier,
  Product,
  Customer,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'password123';
const DAYS = Number(process.env.SEED_DAYS ?? 90);
const PER_DAY_MAX = Number(process.env.SEED_PER_DAY_MAX ?? 4);
// Set SEED_SKIP_IMAGES=true to skip the network image downloads.
const SKIP_IMAGES = process.env.SEED_SKIP_IMAGES === 'true';
const REFRESH_IMAGES = process.env.SEED_IMAGE_REFRESH === 'true';

const configuredImageTimeoutMs = Number(process.env.SEED_IMAGE_TIMEOUT_MS ?? 5000);
const IMAGE_TIMEOUT_MS =
  Number.isFinite(configuredImageTimeoutMs) && configuredImageTimeoutMs > 0
    ? configuredImageTimeoutMs
    : 5000;

// Images are downloaded here and served by the API at /uploads/<file>
// (see app.useStaticAssets in main.ts).
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const IMAGE_UA = 'xstock-wms-seed/1.0 (warehouse demo seeder)';

/**
 * Build the direct upload.wikimedia.org URL for a Commons filename. The storage
 * path is derived from the md5 of the (underscored) filename, exactly how
 * Commons lays files out. We point at the full-size original rather than a
 * `/thumb/` URL because Wikimedia returns 400 for hotlinked thumbnails.
 */
function commonsUrls(filename: string): string[] {
  const fn = filename.replace(/ /g, '_');
  const md5 = crypto.createHash('md5').update(fn, 'utf8').digest('hex');
  const dir = `${md5[0]}/${md5.slice(0, 2)}`;
  const enc = encodeURIComponent(fn);
  return [`https://upload.wikimedia.org/wikipedia/commons/${dir}/${enc}`];
}

async function fetchImage(url: string): Promise<Buffer | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': IMAGE_UA },
        signal: controller.signal,
      });
      if (res.status === 429) return null;
      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      if (!(res.headers.get('content-type') || '').startsWith('image/')) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length >= 1024 ? buf : null;
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

/**
 * Download a specific, curated Wikimedia Commons photo into uploads/ and return
 * its served path (`/uploads/<file>`), mirroring how real uploads are stored.
 * Each `filename` was hand-picked via web search so the image is the actual
 * product — no random placeholders. Falls back to the remote Commons URL if the
 * download fails, so `imagePath` is always populated. Re-runs reuse the local
 * file unless SEED_IMAGE_REFRESH=true is set.
 */
async function resolveImage(
  kind: string,
  code: string,
  filename: string | undefined,
): Promise<string | null> {
  if (!filename) return null;
  const urls = commonsUrls(filename);
  const remoteUrl = urls[urls.length - 1];
  if (SKIP_IMAGES) return remoteUrl;

  const dest = path.join(UPLOADS_DIR, `seed-${kind}-${code}.jpg`);
  const served = `/uploads/seed-${kind}-${code}.jpg`;

  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (!REFRESH_IMAGES && fs.existsSync(dest)) return served;

    for (const url of urls) {
      const buf = await fetchImage(url);
      if (buf) {
        fs.writeFileSync(dest, buf);
        return served;
      }
    }
  } catch {
    // fall through to remote URL
  }

  console.warn(`  image download failed for ${kind} ${code}, using remote URL`);
  return remoteUrl;
}

/** Remove previously seeded images so a run never serves stale photos. */
function clearSeedImages(): void {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) return;
    for (const f of fs.readdirSync(UPLOADS_DIR)) {
      if (/^seed-(product|supplier|customer)-/.test(f)) {
        fs.unlinkSync(path.join(UPLOADS_DIR, f));
      }
    }
  } catch {
    // best-effort cleanup
  }
}

// ---------------------------------------------------------------------------
// Deterministic RNG so re-runs produce the same demo dataset.
// ---------------------------------------------------------------------------
let _seed = 0x9e3779b9;
function rng(): number {
  // mulberry32
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function weighted<T>(entries: Array<[T, number]>): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [value, w] of entries) {
    if ((r -= w) <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

// ---------------------------------------------------------------------------
// Date helpers (all derived from "now" at run time).
// ---------------------------------------------------------------------------
const NOW = new Date();
function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
}
function atDay(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}
function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ---------------------------------------------------------------------------
// Master data
// ---------------------------------------------------------------------------
const users = [
  { name: 'Admin Gudang', email: 'admin@xstock.test', role: UserRole.ADMIN },
  { name: 'Manager Operasional', email: 'manager@xstock.test', role: UserRole.MANAGER },
  { name: 'Staff Warehouse', email: 'staff@xstock.test', role: UserRole.STAFF },
];

const suppliers = [
  { code: 'SUP-001', name: 'Nusantara Workwear', contact: 'Budi Santoso', email: 'sales@nusantara-workwear.test', phone: '+62-21-5550-1101', address: 'Jl. Industri Tekstil No. 12, Tangerang' },
  { code: 'SUP-002', name: 'BersihPro Chemical Supply', contact: 'Siti Rahma', email: 'order@bersihpro.test', phone: '+62-21-5550-2202', address: 'Jl. Raya Bekasi KM 22, Jakarta' },
  { code: 'SUP-003', name: 'Securicom Radio Indonesia', contact: 'Agus Pratama', email: 'hello@securicom-radio.test', phone: '+62-31-5550-3303', address: 'Jl. Ngagel Industri No. 8, Surabaya' },
  { code: 'SUP-004', name: 'IDCraft Lanyard & Badge', contact: 'Rina Hartati', email: 'cs@idcraft-badge.test', phone: '+62-22-5550-4404', address: 'Jl. Buah Batu No. 45, Bandung' },
];

// Facility-operation catalogue: uniforms, cleaning supplies, communication
// devices and ID accessories used by offices, malls, factories and hospitals.
const products = [
  { sku: 'SKU-001', name: 'Worker Uniform Shirt', category: 'Uniform', brand: 'NusaWear', uom: UOM.PCS, lowStockThreshold: 80 },
  { sku: 'SKU-002', name: 'Worker Uniform Pants', category: 'Uniform', brand: 'NusaWear', uom: UOM.PCS, lowStockThreshold: 80 },
  { sku: 'SKU-003', name: 'Reflective Safety Vest', category: 'PPE', brand: 'SafeLine', uom: UOM.PCS, lowStockThreshold: 60 },
  { sku: 'SKU-004', name: 'Satpam Uniform Set', category: 'Security Uniform', brand: 'GuardPro', uom: UOM.BOX, lowStockThreshold: 25 },
  { sku: 'SKU-005', name: 'Security Boots', category: 'PPE', brand: 'GuardPro', uom: UOM.PCS, lowStockThreshold: 30 },
  { sku: 'SKU-006', name: 'Cleaner Uniform Set', category: 'Uniform', brand: 'CleanWear', uom: UOM.BOX, lowStockThreshold: 30 },
  { sku: 'SKU-007', name: 'Mop Head Refill', category: 'Janitorial Tools', brand: 'CleanPro', uom: UOM.PCS, lowStockThreshold: 50 },
  { sku: 'SKU-008', name: 'Microfiber Cloth Pack', category: 'Janitorial Tools', brand: 'CleanPro', uom: UOM.BOX, lowStockThreshold: 40 },
  { sku: 'SKU-009', name: 'Floor Cleaner 5L', category: 'Cleaning Chemical', brand: 'ChemClean', uom: UOM.BOTTLE, lowStockThreshold: 35 },
  { sku: 'SKU-010', name: 'Disinfectant 5L', category: 'Cleaning Chemical', brand: 'ChemClean', uom: UOM.BOTTLE, lowStockThreshold: 35 },
  { sku: 'SKU-011', name: 'Glass Cleaner Spray 500ml', category: 'Cleaning Chemical', brand: 'ChemClean', uom: UOM.BOTTLE, lowStockThreshold: 45 },
  { sku: 'SKU-012', name: 'Walkie Talkie Unit', category: 'Communication', brand: 'RadioLink', uom: UOM.PCS, lowStockThreshold: 20 },
  { sku: 'SKU-013', name: 'Walkie Talkie Battery Pack', category: 'Communication', brand: 'RadioLink', uom: UOM.PCS, lowStockThreshold: 25 },
  { sku: 'SKU-014', name: 'Printed Lanyard Pack', category: 'ID Accessories', brand: 'IDCraft', uom: UOM.BOX, lowStockThreshold: 60 },
];

const customers = [
  { code: 'CUS-001', name: 'Gedung Prima Facilities', contact: 'Dewi Lestari', email: 'procurement@gedungprima-fm.test', phone: '+62-21-5550-4004', address: 'Jl. Sudirman No. 88, Jakarta' },
  { code: 'CUS-002', name: 'Mall Nusantara Operations', contact: 'Hadi Wijaya', email: 'ops-purchasing@mallnusantara.test', phone: '+62-22-5550-5005', address: 'Jl. Asia Afrika No. 12, Bandung' },
  { code: 'CUS-003', name: 'Cakra Industrial Estate', contact: 'Maya Putri', email: 'warehouse@cakra-estate.test', phone: '+62-61-5550-6006', address: 'Jl. Gatot Subroto No. 5, Medan' },
  { code: 'CUS-004', name: 'RS Sentosa Support Services', contact: 'Eko Saputra', email: 'support-services@rssentosa.test', phone: '+62-24-5550-8008', address: 'Jl. Pandanaran No. 3, Semarang' },
];

// Specific Wikimedia Commons photos, hand-picked per SKU via web search, so
// each image is the actual product rather than a random placeholder. Values are
// Commons filenames resolved to direct upload.wikimedia.org URLs (see
// commonsUrls).
const PRODUCT_IMAGE_FILES: Record<string, string> = {
  'SKU-001': 'Pink uniform worker Aug 19 2019 02-14PM.jpeg',
  'SKU-002': 'Pink uniform worker Aug 19 2019 02-14PM.jpeg',
  'SKU-003': 'High-visibility vest.jpg',
  'SKU-004': 'Guard at the Prague castle, Prague - 7620 (cropped).jpg',
  'SKU-005': 'Rubber boots 2204-0240.jpg',
  'SKU-006': 'GD 廣東 Guangdong 廣州 Guangzhou 天河路 TianHe Road cleaning worker in blue uniform on vehicle at work October 2024 R12S 01.jpg',
  'SKU-007': 'Mop for wet use, looped microfiber, velcro back, 60 cm.jpg',
  'SKU-008': 'Microfiber cloth.jpg',
  'SKU-009': 'Blue bucket with Bruce hardwood floor cleaner.jpg',
  'SKU-010': 'Bode Sterillium 100ml bottle.JPG',
  'SKU-011': 'Windex (48089717956).jpg',
  'SKU-012': 'Baofeng UV-5R transceiver.jpg',
  'SKU-013': 'Recreational Walkie Talkies.jpg',
  'SKU-014': 'Lanyard (3379981636) (4).jpg',
};
// Supplier and customer photos are cycled across records.
const SUPPLIER_IMAGE_FILES = [
  'Seamstresses at their stations in the Consolidated Garment Company sewing workshop.jpg',
  'Cleaning product refills in Kindly.jpg',
  'Baofeng UV-5R transceiver.jpg',
  'WMDE-Give-Aways Lanyard mit Wikipedia-Logo.jpg',
];
const CUSTOMER_IMAGE_FILES = [
  'Vale Facilities Management, Springwell Road - geograph.org.uk - 4803624.jpg',
  'Office buildings in Schiedam 2016.jpg',
  'Modern warehouse with pallet rack storage system.jpg',
  'Children\'s Hospital Colorado lobby from 4th floor.jpg',
];

// Warehouse layout: each section holds a handful of stock-bearing BIN
// locations. Products are routed to the section matching their family.
const sections = [
  { code: 'UNIFORM', description: 'Uniform, PPE and janitorial storage' },
  { code: 'ID-ACCESS', description: 'ID accessories and high-count consumables' },
  { code: 'ELECTRONICS', description: 'Communication devices' },
  { code: 'CHEM-STORE', description: 'Cleaning chemicals storage' },
];

// ---------------------------------------------------------------------------

async function clearTransactional() {
  // deepest children first to satisfy FK constraints
  await prisma.movementLock.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.shipmentLine.deleteMany();
  await prisma.goodsReceiptLine.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productBatch.deleteMany();
  await prisma.location.deleteMany();
  await prisma.section.deleteMany();
}

async function main() {
  console.log('Clearing transactional data…');
  await clearTransactional();

  // --- Master data (upsert so identities stay stable) ---------------------
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const userRecords: User[] = [];
  for (const u of users) {
    userRecords.push(
      await prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role },
        create: { ...u, password: passwordHash },
      }),
    );
  }
  console.log(`Seeded ${userRecords.length} users: ${users.map((u) => u.email).join(', ')}.`);

  console.log('Preparing images (set SEED_SKIP_IMAGES=true to skip)…');
  if (REFRESH_IMAGES) clearSeedImages();

  const supplierRecords: Supplier[] = [];
  for (let i = 0; i < suppliers.length; i++) {
    const s = suppliers[i];
    const imagePath = await resolveImage(
      'supplier',
      s.code,
      SUPPLIER_IMAGE_FILES[i % SUPPLIER_IMAGE_FILES.length],
    );
    supplierRecords.push(
      await prisma.supplier.upsert({
        where: { code: s.code },
        update: { ...s, imagePath },
        create: { ...s, imagePath },
      }),
    );
  }

  const productRecords: Product[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const imagePath = await resolveImage('product', p.sku, PRODUCT_IMAGE_FILES[p.sku]);
    productRecords.push(
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: { ...p, imagePath },
        create: { ...p, imagePath },
      }),
    );
  }

  const customerRecords: Customer[] = [];
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    const imagePath = await resolveImage(
      'customer',
      c.code,
      CUSTOMER_IMAGE_FILES[i % CUSTOMER_IMAGE_FILES.length],
    );
    customerRecords.push(
      await prisma.customer.upsert({
        where: { code: c.code },
        update: { ...c, imagePath },
        create: { ...c, imagePath },
      }),
    );
  }
  console.log(
    `Master data ready: ${supplierRecords.length} suppliers, ` +
      `${productRecords.length} products, ${customerRecords.length} customers (with images).`,
  );

  // --- Sections + stock-bearing BIN locations ----------------------------
  interface SeedLocationRecord {
    id: string;
    code: string;
    sectionId: string;
    family: string;
  }

  const BINS_PER_SECTION = 3;
  const locationRecords: SeedLocationRecord[] = [];
  for (const s of sections) {
    const section = await prisma.section.create({
      data: { code: s.code, description: s.description },
    });

    for (let i = 0; i < BINS_PER_SECTION; i++) {
      const loc = await prisma.location.create({
        data: {
          code: `${s.code}-B${String(i + 1).padStart(2, '0')}`,
          type: LocationType.BIN,
          sectionId: section.id,
        },
      });
      locationRecords.push({
        id: loc.id,
        code: loc.code,
        sectionId: section.id,
        family: s.code,
      });
    }
  }
  console.log(
    `Created ${sections.length} sections and ${locationRecords.length} stock-bearing bins.`,
  );

  function binsForProduct(product: Product): SeedLocationRecord[] {
    const category = product.category.toLowerCase();
    let family = 'UNIFORM';

    if (category.includes('chemical')) {
      family = 'CHEM-STORE';
    } else if (category.includes('communication')) {
      family = 'ELECTRONICS';
    } else if (category.includes('id accessories')) {
      family = 'ID-ACCESS';
    }

    const matches = locationRecords.filter((loc) => loc.family === family);
    return matches.length ? matches : locationRecords;
  }

  // --- Batches + inventory ------------------------------------------------
  // For each product: a near/expired batch, a mid batch, and a long-dated
  // batch. Spreading expiry across many months populates the expiry chart;
  // a deliberately small total for some products feeds the low-stock chart.
  const lowStockSkus = new Set(['SKU-004', 'SKU-005', 'SKU-010', 'SKU-012', 'SKU-014']);

  interface BatchInfo {
    id: string;
    productId: string;
    locationId: string;
    receivedAt: Date;
    quantity: number;
  }
  const batchInfos: BatchInfo[] = [];

  for (const product of productRecords) {
    const isLow = lowStockSkus.has(product.sku);
    // expiry offsets in months relative to now: one expired/near, then spread out
    const expiryOffsets = [
      pick([-1, 0, 1]), // expired or expiring soon
      randInt(2, 6),
      randInt(7, 15),
    ];

    for (let b = 0; b < expiryOffsets.length; b++) {
      const receivedAt = daysAgo(randInt(5, DAYS));
      // Schema requires a non-null expiry on every batch.
      const expiryDate = addMonths(NOW, expiryOffsets[b]);
      const batch = await prisma.productBatch.create({
        data: {
          batchNumber: `B-${product.sku}-${b + 1}`,
          productId: product.id,
          expiryDate,
          receivedAt,
          notes:
            b === 0 && expiryOffsets[b] <= 0 ? 'Check freshness before picking' : null,
        },
      });

      // Place this batch into a bin. Keep low-stock products intentionally
      // thin so their summed quantity sits under the reorder threshold.
      const location = pick(binsForProduct(product));
      const quantity = isLow ? randInt(2, 8) : randInt(40, 180);

      await prisma.inventory.create({
        data: {
          productId: product.id,
          batchId: batch.id,
          locationId: location.id,
          quantity,
          reservedQty: randInt(0, Math.min(5, quantity)),
        },
      });

      batchInfos.push({
        id: batch.id,
        productId: product.id,
        locationId: location.id,
        receivedAt,
        quantity,
      });
    }
  }
  console.log(`Created ${batchInfos.length} batches with inventory.`);

  // --- Stock movements ----------------------------------------------------
  const movements: any[] = [];

  // 1) An inbound (GOODS_RECEIPT) movement when each batch was received.
  for (const b of batchInfos) {
    movements.push({
      type: MovementType.IN,
      quantity: b.quantity,
      reason: 'Goods receipt',
      referenceType: ReferenceType.GOODS_RECEIPT,
      productId: b.productId,
      batchId: b.id,
      toLocationId: b.locationId,
      userId: pick(userRecords).id,
      createdAt: atDay(b.receivedAt, randInt(8, 16), randInt(0, 59)),
    });
  }

  // 2) Daily activity across the history window -> one dot per day on the
  //    stock-movement line chart.
  for (let day = DAYS; day >= 0; day--) {
    const date = daysAgo(day);
    const count = randInt(1, PER_DAY_MAX);
    for (let i = 0; i < count; i++) {
      const batch = pick(batchInfos);
      const type = weighted<MovementType>([
        [MovementType.OUT, 5],
        [MovementType.IN, 2],
        [MovementType.TRANSFER, 2],
        [MovementType.ADJUSTMENT, 1],
      ]);
      const quantity = randInt(1, 40);
      const createdAt = atDay(date, randInt(8, 18), randInt(0, 59));
      const user = pick(userRecords).id;

      const base: any = {
        type,
        quantity,
        productId: batch.productId,
        batchId: batch.id,
        userId: user,
        createdAt,
      };

      if (type === MovementType.OUT) {
        base.reason = 'Order fulfilment';
        base.referenceType = ReferenceType.SALES_ORDER;
        base.fromLocationId = batch.locationId;
      } else if (type === MovementType.IN) {
        base.reason = 'Replenishment';
        base.referenceType = ReferenceType.GOODS_RECEIPT;
        base.toLocationId = batch.locationId;
      } else if (type === MovementType.TRANSFER) {
        const dest = pick(locationRecords);
        base.reason = 'Bin transfer';
        base.referenceType = ReferenceType.MANUAL;
        base.fromLocationId = batch.locationId;
        base.toLocationId = dest.id;
      } else {
        base.reason = pick(['Cycle count correction', 'Damaged stock', 'Found stock']);
        base.referenceType = ReferenceType.STOCK_ADJUSTMENT;
        base.toLocationId = batch.locationId;
        base.quantity = randInt(-10, 10) || 1;
      }

      movements.push(base);
    }
  }

  await prisma.stockMovement.createMany({ data: movements });
  console.log(`Created ${movements.length} stock movements across ~${DAYS} days.`);

  // --- Purchase orders + goods receipts ----------------------------------
  let poCount = 0;
  let grnCount = 0;
  for (let i = 0; i < 10; i++) {
    const supplier = pick(supplierRecords);
    const creator = pick(userRecords);
    const orderDate = daysAgo(randInt(1, DAYS));
    const status = weighted<OrderStatus>([
      [OrderStatus.RECEIVED, 4],
      [OrderStatus.PARTIALLY_RECEIVED, 2],
      [OrderStatus.PENDING, 3],
      [OrderStatus.DRAFT, 1],
    ]);

    const itemProducts = [...productRecords]
      .sort(() => rng() - 0.5)
      .slice(0, randInt(2, 4));

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-${String(1000 + i)}`,
        supplierId: supplier.id,
        status,
        orderDate,
        expectedDate: addMonths(orderDate, 1),
        createdBy: creator.id,
        approvedBy: status === OrderStatus.DRAFT ? null : pick(userRecords).id,
        approvedAt: status === OrderStatus.DRAFT ? null : orderDate,
        items: {
          create: itemProducts.map((p) => ({
            productId: p.id,
            quantity: randInt(20, 200),
            unitPrice: randInt(5, 80) * 1000,
          })),
        },
      },
    });
    poCount++;

    if (status === OrderStatus.RECEIVED || status === OrderStatus.PARTIALLY_RECEIVED) {
      await prisma.goodsReceipt.create({
        data: {
          receiptNumber: `GRN-${String(2000 + i)}`,
          purchaseOrderId: po.id,
          status: GoodsReceiptStatus.RECEIVED,
          receivedById: pick(userRecords).id,
          receivedAt: addMonths(orderDate, 0),
          finalizedById: pick(userRecords).id,
          finalizedAt: addMonths(orderDate, 0),
        },
      });
      grnCount++;
    }
  }
  console.log(`Created ${poCount} purchase orders, ${grnCount} goods receipts.`);

  // --- Sales orders + shipments ------------------------------------------
  let soCount = 0;
  let shipCount = 0;
  for (let i = 0; i < 12; i++) {
    const customer = pick(customerRecords);
    const creator = pick(userRecords);
    const orderDate = daysAgo(randInt(1, DAYS));
    const status = weighted<SalesOrderStatus>([
      [SalesOrderStatus.SHIPPED, 4],
      [SalesOrderStatus.PARTIALLY_SHIPPED, 2],
      [SalesOrderStatus.PENDING, 3],
      [SalesOrderStatus.DRAFT, 1],
    ]);

    const itemProducts = [...productRecords]
      .sort(() => rng() - 0.5)
      .slice(0, randInt(1, 4));

    const so = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${String(3000 + i)}`,
        customerId: customer.id,
        status,
        orderDate,
        userId: creator.id,
        items: {
          create: itemProducts.map((p) => ({
            productId: p.id,
            quantity: randInt(5, 60),
            unitPrice: randInt(8, 120) * 1000,
          })),
        },
      },
    });
    soCount++;

    if (
      status === SalesOrderStatus.SHIPPED ||
      status === SalesOrderStatus.PARTIALLY_SHIPPED
    ) {
      const shipped = addMonths(orderDate, 0);
      const delivered = status === SalesOrderStatus.SHIPPED;
      await prisma.shipment.create({
        data: {
          shipmentNumber: `SHP-${String(4000 + i)}`,
          salesOrderId: so.id,
          status: delivered ? ShipmentStatus.DELIVERED : ShipmentStatus.IN_TRANSIT,
          shippedAt: shipped,
          deliveredAt: delivered ? new Date(shipped.getTime() + 2 * 86400000) : null,
          userId: pick(userRecords).id,
        },
      });
      shipCount++;
    }
  }
  console.log(`Created ${soCount} sales orders, ${shipCount} shipments.`);

  console.log('\nDemo seed complete.');
  console.log(
    `Logins: ${users.map((u) => u.email).join(', ')} / "${SEED_PASSWORD}" ` +
      '(override with SEED_ADMIN_PASSWORD).',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
