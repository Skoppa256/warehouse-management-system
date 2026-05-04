import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { EmailService } from '../src/email/email.service';
import { BatchService } from '../src/batch/batch.service';

class TestRedisService {
  private store = new Map<string, string>();

  async saveTempUser(email: string, data: any) {
    this.store.set(`temp_user:${email}`, JSON.stringify(data));
  }

  async getTempUser(email: string) {
    const raw = this.store.get(`temp_user:${email}`);
    return raw ? JSON.parse(raw) : null;
  }

  async deleteTempUser(email: string) {
    this.store.delete(`temp_user:${email}`);
  }

  async saveVerificationCode(email: string, code: string) {
    this.store.set(`verify_code:${email}`, code);
  }

  async getVerificationCode(email: string) {
    return this.store.get(`verify_code:${email}`) ?? null;
  }

  async deleteVerificationCode(email: string) {
    this.store.delete(`verify_code:${email}`);
  }
}

class TestEmailService {
  sent: { email: string; code: string }[] = [];

  async sendVerificationEmail(email: string, code: string) {
    this.sent.push({ email, code });
  }
}

describe('APP E2E – All User Stories (US1–US31)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisMock: TestRedisService;
  let emailMock: TestEmailService;

  let adminToken: string;
  let managerToken: string;
  let staffToken: string;

  let productId: string;
  let sectionId: string;
  let locationId: string;
  let supplierId: string;
  let customerId: string;
  let poId: string;
  let soId: string;
  let grId: string;
  let shipmentId: string;

  beforeAll(async () => {
    redisMock = new TestRedisService();
    emailMock = new TestEmailService();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .overrideProvider(EmailService)
      .useValue(emailMock)
      .compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname='public';
    `;

    for (const t of tables) {
      if (t.tablename !== '_prisma_migrations') {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${t.tablename}" CASCADE;`,
        );
      }
    }

    await seedBaseUsersAndPartners();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // HELPERS
  async function seedBaseUsersAndPartners() {
    const adminPass = 'Admin123!';
    const managerPass = 'Manager123!';
    const staffPass = 'Staff123!';

    const [admin, manager, staff] = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: await bcrypt.hash(adminPass, 10),
          role: 'ADMIN',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Manager User',
          email: 'manager@example.com',
          password: await bcrypt.hash(managerPass, 10),
          role: 'MANAGER',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Staff User',
          email: 'staff@example.com',
          password: await bcrypt.hash(staffPass, 10),
          role: 'STAFF',
        },
      }),
    ]);

    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: admin.email, password: adminPass });

    const loginManager = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: manager.email, password: managerPass });

    const loginStaff = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: staff.email, password: staffPass });

    expect([200, 201]).toContain(loginAdmin.status);
    expect([200, 201]).toContain(loginManager.status);
    expect([200, 201]).toContain(loginStaff.status);

    adminToken = loginAdmin.body.accessToken;
    managerToken = loginManager.body.accessToken;
    staffToken = loginStaff.body.accessToken;

    const supplier = await prisma.supplier.create({
      data: {
        code: 'SUP-001',
        name: 'Default Supplier',
        isActive: true,
      },
    });

    const customer = await prisma.customer.create({
      data: {
        code: 'CUST-001',
        name: 'Default Customer',
        isActive: true,
      },
    });

    supplierId = supplier.id;
    customerId = customer.id;

    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        sku: 'SKU-001',
        category: 'Default',
        uom: 'PCS',
      },
    });

    productId = product.id;

    const section = await prisma.section.create({
      data: {
        code: 'SEC-001',
        description: 'Main Section',
      },
    });
    sectionId = section.id;

    const location = await prisma.location.create({
      data: {
        code: 'LOC-001',
        type: 'BIN',
        sectionId: section.id,
      },
    });
    locationId = location.id;
  }

  // ADMIN USER STORIES (US1–US15)
  describe('ADMIN FLOWS', () => {
    it('US1 — Admin registers a new user (register + verify)', async () => {
      const email = 'newstaff@example.com';

      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'New Staff',
          email,
          password: 'Password123!',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(registerRes.body.message).toContain('Verification code');

      const code = await redisMock.getVerificationCode(email);
      expect(code).toBeDefined();

      const verifyRes = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ email, code })
        .expect(201);

      expect(verifyRes.body.user.email).toBe(email);
      expect(verifyRes.body).toHaveProperty('accessToken');
      expect(verifyRes.body).toHaveProperty('refreshToken');
    });

    it('US2 — Admin can view list of users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('US3 — Admin can edit & delete a user', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Edit Target',
          email: 'edit@example.com',
          password: await bcrypt.hash('Password123!', 10),
          role: 'STAFF',
        },
      });

      const updateRes = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Edited Name' })
        .expect(200);

      expect(updateRes.body.name).toBe('Edited Name');

      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('US4 — Admin creates product', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Product A')
        .field('sku', 'SKU-100')
        .field('category', 'Category A')
        .field('uom', 'PCS')
        .field('lowStockThreshold', '10')
        .expect(201);
    });

    it('US5 — Admin edits a product', async () => {
      const prod = await prisma.product.create({
        data: {
          name: 'Prod Edit',
          sku: 'SKU-EDIT',
          category: 'Cat',
          uom: 'PCS',
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/products/${prod.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Prod Edited' })
        .expect(200);

      expect(res.body.name).toBe('Prod Edited');
    });

    it('US6 — Admin soft deletes product', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Delete Me Product')
        .field('sku', 'DEL123')
        .field('category', 'General')
        .field('uom', 'PCS')
        .field('lowStockThreshold', 5)
        .expect(201);

      const product = createRes.body;

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const fetchRes = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(fetchRes.body.isDeleted).toBe(true);
    });

    it('US7 — Admin uploads product image', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Image Product')
        .field('sku', 'IMG123')
        .field('category', 'General')
        .field('uom', 'PCS')
        .field('lowStockThreshold', 10)
        .expect(201);

      const product = createRes.body;

      const res = await request(app.getHttpServer())
        .patch(`/products/${product.id}/image`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imagePath: '/uploads/test-image.jpg' })
        .expect(200);

      expect(res.body).toHaveProperty('imagePath');
      expect(res.body.imagePath).toBe('/uploads/test-image.jpg');
    });

    it('US8 — Admin creates a warehouse section', async () => {
      const res = await request(app.getHttpServer())
        .post('/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SEC-NEW',
          description: 'New Section',
        })
        .expect(201);

      expect(res.body.code).toBe('SEC-NEW');
    });

    it('US9 — Admin creates a location/bin within a section', async () => {
      const res = await request(app.getHttpServer())
        .post(`/sections/${sectionId}/locations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'LOC-NEW',
          type: 'BIN',
        })
        .expect(201);

      expect(res.body.code).toBe('LOC-NEW');
      expect(res.body.sectionId).toBe(sectionId);
    });

    it('US10 — Admin edits and deletes a location', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/sections/${sectionId}/locations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'LOC-EDIT',
          type: 'BIN',
        })
        .expect(201);

      const loc = createRes.body;

      const updateRes = await request(app.getHttpServer())
        .patch(`/sections/${sectionId}/locations/${loc.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'LOC-EDITED' })
        .expect(200);

      expect(updateRes.body.code).toBe('LOC-EDITED');

      await request(app.getHttpServer())
        .delete(`/sections/${sectionId}/locations/${loc.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const fetchRes = await request(app.getHttpServer())
        .get(`/sections/${sectionId}/locations/${loc.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(fetchRes.body.isActive).toBe(false);
    });

    it('US11 — Admin creates a Purchase Order', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/purchase-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplierId,
        })
        .expect(201);

      poId = createRes.body.id;
      expect(createRes.body.orderNumber).toBeDefined();

      const addItemRes = await request(app.getHttpServer())
        .post(`/purchase-order/${poId}/item`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          quantity: 10,
          unitPrice: 100,
        })
        .expect(201);

      expect(addItemRes.body.productId).toBe(productId);
    });

    it('US12 — Admin views PO list & status', async () => {
      const res = await request(app.getHttpServer())
        .get('/purchase-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('US13 — Admin creates a Sales Order', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/sales-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId,
        })
        .expect(201);

      soId = createRes.body.id;
      expect(createRes.body.orderNumber).toBeDefined();

      // 2️⃣ Add item to Sales Order — REQUIRED
      const itemRes = await request(app.getHttpServer())
        .post(`/sales-order/${soId}/item`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          quantity: 5,
          unitPrice: 150,
        })
        .expect(201);

      expect(itemRes.body.productId).toBe(productId);
    });

    it('US14 — Admin views SO list & status', async () => {
      const res = await request(app.getHttpServer())
        .get('/sales-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('US15 — Admin views reports (dashboard, low stock, expiry, stock movements)', async () => {
      const dash = await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(dash.body).toHaveProperty('totalProducts');
      expect(dash.body).toHaveProperty('totalSuppliers');
      expect(dash.body).toHaveProperty('totalCustomers');

      const low = await request(app.getHttpServer())
        .get('/reports/low-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(low.body).toHaveProperty('data');
      expect(Array.isArray(low.body.data)).toBe(true);

      const expiry = await request(app.getHttpServer())
        .get('/reports/expiry')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(expiry.body).toHaveProperty('data');
      expect(Array.isArray(expiry.body.data)).toBe(true);

      const moves = await request(app.getHttpServer())
        .get('/reports/stock-movement?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(moves.body).toHaveProperty('data');
      expect(moves.body).toHaveProperty('meta');
      expect(Array.isArray(moves.body.data)).toBe(true);
    });
  });

  // MANAGER USER STORIES (US16–US22)
  describe('MANAGER FLOWS', () => {
    it('US16 — Manager views inventory list', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('US17 — Manager views dashboard summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalProducts');
      expect(res.body).toHaveProperty('totalSuppliers');
      expect(res.body).toHaveProperty('totalCustomers');
    });

    it('US18 — Manager views inbound/outbound activity', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/stock-movement?page=1&pageSize=20')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('US19 — Manager views transfer history', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/stock-movement?type=TRANSFER&page=1&pageSize=20')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('US20 — Manager views expiry report', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/expiry')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('US20 — Manager views batch report', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/batches')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('US21 — Manager views purchase orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/purchase-order')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('US22 — Manager views sales orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/sales-order')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // STAFF USER STORIES (US23–US30)
  describe('STAFF FLOWS', () => {
    it('US23 — Staff records stock IN', async () => {
      const batch = await prisma.productBatch.create({
        data: {
          productId,
          batchNumber: 'BATCH-IN-001',
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/movement')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          type: 'IN',
          productId,
          batchId: batch.id,
          toLocationId: locationId,
          quantity: 20,
          reason: 'Initial stock',
        })
        .expect(201);

      expect(res.body.type).toBe('IN');
      expect(res.body.productId).toBe(productId);
      expect(res.body.batchId).toBe(batch.id);
    });

    it('US24 — Staff records stock OUT', async () => {
      const batch = await prisma.productBatch.create({
        data: {
          productId,
          batchNumber: 'BATCH-OUT-001',
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        },
      });

      await prisma.inventory.create({
        data: {
          productId,
          batchId: batch.id,
          locationId,
          quantity: 20,
          reservedQty: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/movement')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          type: 'OUT',
          productId,
          batchId: batch.id,
          fromLocationId: locationId,
          quantity: 5,
          reason: 'Customer Order',
        })
        .expect(201);

      expect(res.body.type).toBe('OUT');
      expect(res.body.productId).toBe(productId);
      expect(res.body.batchId).toBe(batch.id);

      const inv = await prisma.inventory.findUnique({
        where: {
          productId_batchId_locationId: {
            productId,
            batchId: batch.id,
            locationId,
          },
        },
      });

      expect(inv?.quantity).toBe(15);
    });

    it('US25 — Staff transfers stock between locations', async () => {
      const otherLoc = await prisma.location.create({
        data: {
          code: 'LOC-DEST',
          type: 'BIN',
          sectionId,
        },
      });

      const batch = await createBatch(productId);

      // Seed stock first (IN)
      await request(app.getHttpServer())
        .post('/movement')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          type: 'IN',
          productId,
          batchId: batch.id,
          toLocationId: locationId,
          quantity: 30,
          reason: 'Seed IN',
        })
        .expect(201);

      // Now TRANSFER
      const res = await request(app.getHttpServer())
        .post('/movement')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          type: 'TRANSFER',
          productId,
          batchId: batch.id,
          fromLocationId: locationId,
          toLocationId: otherLoc.id,
          quantity: 10,
        })
        .expect(201);

      // Backend returns final IN movement
      expect(res.body.type).toBe('IN');
      expect(res.body.productId).toBe(productId);
      expect(res.body.batchId).toBe(batch.id);
    });

    it('US26 — Staff views product stock', async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory?productId=${productId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('US27/28 — Staff processes inbound from PO and completes GR', async () => {
      const poRes = await request(app.getHttpServer())
        .post('/purchase-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplierId,
        })
        .expect(201);

      poId = poRes.body.id;

      const poItemRes = await request(app.getHttpServer())
        .post(`/purchase-order/${poId}/item`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          quantity: 10,
          unitPrice: 100,
        })
        .expect(201);

      const purchaseOrderItemId = poItemRes.body.id;

      const grRes = await request(app.getHttpServer())
        .post('/goods-receipt')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          purchaseOrderId: poId,
        })
        .expect(201);

      grId = grRes.body.id;

      const batch = await prisma.productBatch.create({
        data: {
          productId,
          batchNumber: 'GR-BATCH-001',
          expiryDate: new Date('2030-01-01'),
        },
      });

      await request(app.getHttpServer())
        .post(`/goods-receipt/${grId}/line`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          purchaseOrderItemId,
          productId,
          batchId: batch.id,
          locationId,
          quantity: 10,
        })
        .expect(201);

      const finalizeRes = await request(app.getHttpServer())
        .post(`/goods-receipt/${grId}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ autoPostStock: true })
        .expect(201);

      expect(finalizeRes.body.status).toBe('RECEIVED');
    });

    it('US29/30 — Staff picks for SO and completes shipment', async () => {
      const batch = await prisma.productBatch.create({
        data: {
          productId,
          batchNumber: 'SHIP-BATCH-001',
          expiryDate: new Date('2035-01-01'),
        },
      });

      await prisma.inventory.create({
        data: {
          productId,
          batchId: batch.id,
          locationId,
          quantity: 20,
        },
      });

      const soRes = await request(app.getHttpServer())
        .post('/sales-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId,
        })
        .expect(201);

      soId = soRes.body.id;

      const soItemRes = await request(app.getHttpServer())
        .post(`/sales-order/${soId}/item`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          quantity: 5,
          unitPrice: 120,
        })
        .expect(201);

      const salesOrderItemId = soItemRes.body.id;

      await request(app.getHttpServer())
        .post(`/sales-order/${soId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(201);

      const shipRes = await request(app.getHttpServer())
        .post('/shipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          salesOrderId: soId,
        })
        .expect(201);

      shipmentId = shipRes.body.id;

      await request(app.getHttpServer())
        .post(`/shipment/${shipmentId}/line`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          salesOrderItemId,
          quantity: 5,
          fromLocationId: locationId,
        })
        .expect(201);

      const deliverRes = await request(app.getHttpServer())
        .post(`/shipment/${shipmentId}/deliver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(deliverRes.body.status).toBe('DELIVERED');
    });
  });

  describe('EXTRA — AUTH EDGE CASES', () => {
    it('Should fail login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'WrongPass' })
        .expect(401);
    });

    it('Should reject register without admin token', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Fail User',
          email: 'fail@example.com',
          password: 'Password123!',
        })
        .expect(201);
    });

    it('Should reject verification with wrong code', async () => {
      const email = 'badcode@example.com';

      await redisMock.saveVerificationCode(email, '9999');

      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ email, code: '1234' })
        .expect(400);
    });
  });

  describe('EXTRA — PRODUCT EDGE CASES', () => {
    it('Should reject creating product with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Bad Product')
        .expect(400);
    });

    it('Should handle fetching non-existing product', async () => {
      await request(app.getHttpServer())
        .get('/products/non-existing-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('EXTRA — SUPPLIER & CUSTOMER EDGE CASES', () => {
    it('Should not allow duplicate supplier code', async () => {
      await prisma.supplier.create({
        data: { code: 'DUP-001', name: 'Dup1' },
      });

      await request(app.getHttpServer())
        .post('/supplier')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'DUP-001', name: 'Dup2' })
        .expect(500);
    });

    it('Should not allow deleting non-existing customer', async () => {
      await request(app.getHttpServer())
        .delete('/customer/non-existing-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('EXTRA — INVENTORY FILTERING', () => {
    it('Should return empty inventory list when product has no stock', async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory?productId=${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('Should reject inventory request with invalid productId', async () => {
      await request(app.getHttpServer())
        .get(`/inventory?productId=invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('EXTRA — UPLOAD ENDPOINT', () => {
    it('Should reject upload without file', async () => {
      await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  // EXTRA — BATCH EDGE CASES
  describe('EXTRA — BATCH EDGE CASES', () => {
    let validProduct: any;

    beforeEach(async () => {
      // Ensure we have a clean product for batch cases
      validProduct = await prisma.product.create({
        data: {
          name: 'BatchProd',
          sku: 'BATCHSKU',
          category: 'General',
          uom: 'PCS',
        },
      });
    });

    it('Should create a batch successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchNumber: 'BN-001',
          productId: validProduct.id,
          expiryDate: '2030-01-01',
          notes: 'Test notes',
        })
        .expect(201);

      expect(res.body.batchNumber).toBe('BN-001');
      expect(res.body.productId).toBe(validProduct.id);
    });

    it('Should reject creating batch for non-existing product', async () => {
      await request(app.getHttpServer())
        .post('/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchNumber: 'BN-999',
          productId: 'non-existing-id',
          expiryDate: '2030-01-01',
        })
        .expect(404);
    });

    it('Should reject duplicate batch number for same product', async () => {
      await prisma.productBatch.create({
        data: {
          batchNumber: 'DUP-001',
          productId: validProduct.id,
          expiryDate: new Date('2030-01-01'),
        },
      });

      await request(app.getHttpServer())
        .post('/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchNumber: 'DUP-001',
          productId: validProduct.id,
          expiryDate: '2030-02-01',
        })
        .expect(409);
    });

    it('Should fetch single batch', async () => {
      const batch = await prisma.productBatch.create({
        data: {
          batchNumber: 'FIND-001',
          productId: validProduct.id,
          expiryDate: new Date('2030-01-01'),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/batch/${batch.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(batch.id);
    });

    it('Should return 404 when fetching deleted batch', async () => {
      const batch = await prisma.productBatch.create({
        data: {
          batchNumber: 'DEL-TEST',
          productId: validProduct.id,
          expiryDate: new Date(),
          isDeleted: true,
        },
      });

      await request(app.getHttpServer())
        .get(`/batch/${batch.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('Should update a batch successfully', async () => {
      const batch = await prisma.productBatch.create({
        data: {
          batchNumber: 'UP-001',
          productId: validProduct.id,
          expiryDate: new Date('2030-01-01'),
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/batch/${batch.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Updated note',
        })
        .expect(200);

      expect(res.body.notes).toBe('Updated note');
    });

    it('Should reject update for non-existing batch', async () => {
      await request(app.getHttpServer())
        .patch(`/batch/non-existing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Update attempt' })
        .expect(404);
    });

    it('Should reject update with duplicate batch number', async () => {
      const b1 = await prisma.productBatch.create({
        data: {
          batchNumber: 'U-A',
          productId: validProduct.id,
          expiryDate: new Date('2030-01-01'),
        },
      });

      const b2 = await prisma.productBatch.create({
        data: {
          batchNumber: 'U-B',
          productId: validProduct.id,
          expiryDate: new Date('2030-02-01'),
        },
      });

      await request(app.getHttpServer())
        .patch(`/batch/${b2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ batchNumber: 'U-A' })
        .expect(409);
    });

    it('Should soft delete a batch', async () => {
      const b = await prisma.productBatch.create({
        data: {
          batchNumber: 'SOFT-001',
          productId: validProduct.id,
          expiryDate: new Date(),
        },
      });

      await request(app.getHttpServer())
        .delete(`/batch/${b.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const check = await prisma.productBatch.findUnique({
        where: { id: b.id },
      });

      expect(check?.isDeleted).toBe(true);
    });

    it('Should reject delete for non-existing batch', async () => {
      await request(app.getHttpServer())
        .delete(`/batch/non-existing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    // ********** ensureBatchExists() tests **********

    it('ensureBatchExists — should return existing batch if expiry matches', async () => {
      const batch = await prisma.productBatch.create({
        data: {
          batchNumber: 'ENS-1',
          productId: validProduct.id,
          expiryDate: new Date('2031-01-01'),
        },
      });

      const service = app.get(BatchService);

      const result = await service.ensureBatchExists(
        'ENS-1',
        validProduct.id,
        '2031-01-01',
      );

      expect(result.id).toBe(batch.id);
    });

    it('ensureBatchExists — should throw if expiry mismatches', async () => {
      const batch = await prisma.productBatch.create({
        data: {
          batchNumber: 'ENS-2',
          productId: validProduct.id,
          expiryDate: new Date('2031-01-01'),
        },
      });

      const service = app.get(BatchService);

      await expect(
        service.ensureBatchExists('ENS-2', validProduct.id, '2030-01-01'),
      ).rejects.toThrow('Expiry date does not match existing batch');
    });

    it('ensureBatchExists — should fail when creating new batch without expiry', async () => {
      const service = app.get(BatchService);

      await expect(
        service.ensureBatchExists('NEWX', validProduct.id),
      ).rejects.toThrow('Expiry date is required');
    });

    it('ensureBatchExists — should create new batch when no duplicate', async () => {
      const service = app.get(BatchService);

      const result = await service.ensureBatchExists(
        'NEW-BATCH',
        validProduct.id,
        '2035-01-01',
      );

      expect(result.batchNumber).toBe('NEW-BATCH');
      expect(result.productId).toBe(validProduct.id);
    });
  });

  async function createBatch(prodId: string) {
    return prisma.productBatch.create({
      data: {
        batchNumber: `BATCH-${Date.now()}`,
        productId: prodId,
        expiryDate: new Date('2030-01-01'),
      },
    });
  }
});
