import type { AppDb } from './client';
import {
  brands, models, modelYears, categories,
  parts, partOemNumbers, partImages, partCompatibilities, partVariants,
  schematics, schematicHotspots, schematicApplicableModels, schematicSections,
  orderStatuses, carriers, modelCategories,
  orders, orderItems, orderReturns, siteSettings,
  users, userFavorites, userPermissions,
  shippingMethods, shippingZones, shippingZoneStates, shippingMethodZoneRates,
  shippingZoneCities,
  countries, states, cities,
  inventoryMovements, stockReservations
} from './schema';
import { eq, and, or, inArray, lte, gt, desc, sql } from 'drizzle-orm';
import { DEFAULT_SHIPPING_ZONES, DEFAULT_SHIPPING_METHODS, DEFAULT_COLOMBIAN_CITIES, COLOMBIAN_DEPARTMENTS } from '../data/initialShippingAndCities';
import { STORE_DEFAULT_LOCATION, STORE_BOOTSTRAP, FOOTER_BOOTSTRAP, getBootstrapShowProductImages } from '../utils/config';
import { hashPassword } from '../utils/password';
import type { SiteSettings, PaymentSettings, WompiConfig, InventoryReservationSettings, StockReservation } from '../types';
import { isPaidOrderStatus, isCancelOrderStatus } from '../types';

export function isValidUuid(val: any): boolean {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function ensureUuid(val?: any): string {
  if (isValidUuid(val)) return val;
  return crypto.randomUUID();
}

export function normalizeDocumentNumber(val?: any): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  return s.replace(/^[A-Z]+(?:-[A-Z]+)?-/, '');
}

export function parseJson(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export async function formatParts(db: AppDb, rows: any[]) {
  if (rows.length === 0) return [];

  const oemAll = await db.select().from(partOemNumbers);
  const compatAll = await db.select().from(partCompatibilities);
  const imgAll = await db.select().from(partImages);
  const variantsAll = await db.select().from(partVariants);

  const oemByPart = new Map<string, typeof oemAll>();
  for (const r of oemAll) {
    const arr = oemByPart.get(r.partId) || [];
    arr.push(r);
    oemByPart.set(r.partId, arr);
  }
  const compatByPart = new Map<string, typeof compatAll>();
  for (const r of compatAll) {
    const arr = compatByPart.get(r.partId) || [];
    arr.push(r);
    compatByPart.set(r.partId, arr);
  }
  const imgByPart = new Map<string, typeof imgAll>();
  for (const r of imgAll) {
    const arr = imgByPart.get(r.partId) || [];
    arr.push(r);
    imgByPart.set(r.partId, arr);
  }
  const variantsByPart = new Map<string, typeof variantsAll>();
  for (const v of variantsAll) {
    const arr = variantsByPart.get(v.partId) || [];
    arr.push(v);
    variantsByPart.set(v.partId, arr);
  }

  return rows.map(p => ({
    ...p,
    sku: p.sku || `SKU-${p.id}`,
    oemNumbers: (oemByPart.get(p.id) || []).sort((a, b) => a.position - b.position).map(r => r.oemNumber),
    images: (imgByPart.get(p.id) || []).sort((a, b) => a.position - b.position).map(r => r.url),
    variants: (variantsByPart.get(p.id) || []).sort((a, b) => a.position - b.position).map(v => ({
      id: v.id,
      partId: v.partId,
      variantType: (v.variantType || 'color') as 'color' | 'side' | 'size' | 'material' | 'finish' | 'other',
      name: v.name,
      colorCode: v.colorCode || null,
      colorHex: v.colorHex || null,
      sku: v.sku || null,
      price: v.price != null ? Number(v.price) : null,
      cost: Number(v.cost || 0),
      stock: Number(v.stock || 0),
      stockReserved: Number(v.stockReserved || 0),
      image: v.image || null,
      attributes: Array.isArray(v.attributes) ? v.attributes : [],
      position: Number(v.position || 0),
      active: v.active !== false
    })),
    specs: p.specs || [],
    compatibility: (compatByPart.get(p.id) || []).map(r => ({
      modelId: r.modelId,
      yearStart: r.yearStart,
      yearEnd: r.yearEnd,
      version: r.version,
      note: r.note
    })),
    diagramHotspot: p.diagramHotspot ?? null,
    leadTimeMinDays: p.leadTimeMinDays ?? null,
    leadTimeMaxDays: p.leadTimeMaxDays ?? null,
    active: p.active !== false,
    taxable: p.taxable !== false,
    priceIncludesTax: p.priceIncludesTax === true
  }));
}

export async function upsertModel(db: AppDb, body: any) {
  const id = ensureUuid(body.id);

  let targetBrandId = body.brandId;
  const allBrands = await db.select().from(brands);

  if (allBrands.length > 0) {
    const matchedBrand = allBrands.find(
      b => b.id === targetBrandId || b.name.toLowerCase() === (targetBrandId || '').toLowerCase()
    );
    if (matchedBrand) {
      targetBrandId = matchedBrand.id;
    } else {
      const suzukiBrand = allBrands.find(b => b.name.toLowerCase().includes('suzuki'));
      targetBrandId = suzukiBrand ? suzukiBrand.id : allBrands[0].id;
    }
  }

  const data = {
    id,
    brandId: targetBrandId,
    name: body.name,
    slug: body.slug || body.name?.toLowerCase().replace(/\s+/g, '-'),
    category: body.category,
    image: body.image,
    versions: body.versions || [],
    active: body.active !== undefined ? body.active : true,
    notes: body.notes || ''
  };

  await db.transaction(async (tx) => {
    await tx.insert(models).values(data).onConflictDoUpdate({ target: models.id, set: data });
    await tx.delete(modelYears).where(eq(modelYears.modelId, id));
    for (const year of body.years || []) {
      if (typeof year === 'number') {
        await tx.insert(modelYears).values({ id: crypto.randomUUID(), modelId: id, year }).onConflictDoNothing();
      }
    }
  });

  return data;
}

export async function upsertPart(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const sku = body.sku ? String(body.sku).trim() : `SKU-${id.substring(0, 8).toUpperCase()}`;

  const rawImages = Array.isArray(body.images) ? body.images.filter((u: any) => u && typeof u === 'string' && u.trim()) : [];
  const images = rawImages.map((u: any) => String(u).trim());
  const primaryImage = body.image && typeof body.image === 'string' && body.image.trim()
    ? String(body.image).trim()
    : images[0] || '';

  let data: any = null;

  await db.transaction(async (tx) => {
    let resolvedCategory = body.category ? String(body.category).trim() : '';
    if (!resolvedCategory) {
      resolvedCategory = 'motor';
    }

    // Verify category exists in categories table to satisfy Foreign Key
    const catCheck = await tx.select().from(categories).where(eq(categories.slug, resolvedCategory));
    if (catCheck.length === 0) {
      const allCats = await tx.select().from(categories);
      const match = allCats.find(c =>
        c.slug.toLowerCase() === resolvedCategory.toLowerCase() ||
        c.name.toLowerCase() === resolvedCategory.toLowerCase()
      );
      if (match) {
        resolvedCategory = match.slug;
      } else {
        const newSlug = resolvedCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'categoria-general';
        await tx.insert(categories).values({
          id: crypto.randomUUID(),
          name: resolvedCategory,
          slug: newSlug,
          order: 99,
          active: true
        }).onConflictDoNothing();
        resolvedCategory = newSlug;
      }
    }

    const existingPart = await tx.select({ id: parts.id }).from(parts).where(eq(parts.id, id)).limit(1);
    const isNewPart = existingPart.length === 0;

    data = {
      id,
      sku,
      name: body.name,
      category: resolvedCategory,
      price: Number(body.price),
      cost: Number(body.cost || 0),
      stock: Number(body.stock || 0),
      image: primaryImage,
      description: body.description || '',
      specs: body.specs || [],
      schematicId: body.schematicId ? ensureUuid(body.schematicId) : null,
      diagramHotspot: body.diagramHotspot || null,
      availability: body.availability || 'in_stock',
      leadTimeMinDays: body.leadTimeMinDays != null ? Number(body.leadTimeMinDays) : null,
      leadTimeMaxDays: body.leadTimeMaxDays != null ? Number(body.leadTimeMaxDays) : null,
      active: body.active !== false,
      taxable: body.taxable !== false,
      priceIncludesTax: body.priceIncludesTax === true
    };

    await tx.insert(parts).values(data).onConflictDoUpdate({ target: parts.id, set: data });

    if (isNewPart && data.stock > 0) {
      await tx.insert(inventoryMovements).values({
        id: crypto.randomUUID(),
        partId: id,
        movementType: 'INITIAL_STOCK',
        quantity: data.stock,
        previousStock: 0,
        resultingStock: data.stock,
        unitCost: data.cost || (data.price * 0.6),
        unitPrice: data.price,
        totalAmount: data.stock * (data.cost || (data.price * 0.6)),
        referenceType: 'initial_balance',
        referenceId: null,
        referenceDocument: 'CREACION-REPUESTO',
        notes: 'Stock inicial al registrar repuesto',
        userName: 'Admin',
        createdAt: new Date()
      }).onConflictDoNothing();
    }

    await tx.delete(partImages).where(eq(partImages.partId, id));
    for (let i = 0; i < images.length; i++) {
      await tx.insert(partImages).values({
        id: crypto.randomUUID(),
        partId: id,
        url: images[i],
        position: i,
        isPrimary: i === 0
      }).onConflictDoNothing();
    }

    await tx.delete(partOemNumbers).where(eq(partOemNumbers.partId, id));
    for (let i = 0; i < (body.oemNumbers || []).length; i++) {
      const oem = body.oemNumbers[i];
      if (oem && typeof oem === 'string') {
        await tx.insert(partOemNumbers).values({
          id: crypto.randomUUID(),
          partId: id,
          oemNumber: oem,
          isPrimary: i === 0,
          position: i
        }).onConflictDoNothing();
      }
    }

    await tx.delete(partCompatibilities).where(eq(partCompatibilities.partId, id));
    for (let i = 0; i < (body.compatibility || []).length; i++) {
      const c = body.compatibility[i];
      if (c && c.modelId) {
        await tx.insert(partCompatibilities).values({
          id: crypto.randomUUID(),
          partId: id,
          modelId: c.modelId,
          yearStart: c.yearStart ? Number(c.yearStart) : null,
          yearEnd: c.yearEnd ? Number(c.yearEnd) : null,
          version: c.version || null,
          note: c.note || null
        }).onConflictDoNothing();
      }
    }

    // Sync part_variants
    await tx.delete(partVariants).where(eq(partVariants.partId, id));
    if (Array.isArray(body.variants)) {
      for (let i = 0; i < body.variants.length; i++) {
        const v = body.variants[i];
        if (v && v.name && String(v.name).trim()) {
          await tx.insert(partVariants).values({
            id: ensureUuid(v.id),
            partId: id,
            variantType: v.variantType || 'color',
            name: String(v.name).trim(),
            colorCode: v.colorCode ? String(v.colorCode).trim() : null,
            colorHex: v.colorHex ? String(v.colorHex).trim() : null,
            sku: v.sku ? String(v.sku).trim() : null,
            price: v.price != null && v.price !== '' ? Number(v.price) : null,
            cost: v.cost != null && v.cost !== '' ? Number(v.cost) : 0,
            stock: Number(v.stock || 0),
            stockReserved: Number(v.stockReserved || 0),
            image: v.image || null,
            attributes: Array.isArray(v.attributes) ? v.attributes : [],
            position: i,
            active: v.active !== false
          }).onConflictDoNothing();
        }
      }
    }
  });

  return data;
}

export async function upsertSchematic(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const section = (body.section && String(body.section).trim()) || 'Motor';
  const category = (body.category && String(body.category).trim()) || section;

  const data = {
    id,
    title: body.title,
    slug: body.slug || body.title?.toLowerCase().replace(/\s+/g, '-'),
    category,
    section,
    diagramImage: body.diagramImage,
    description: body.description || ''
  };

  await db.transaction(async (tx) => {
    // Ensure section exists in schematic_sections catalog to satisfy FK constraint
    await tx.insert(schematicSections).values({
      id: crypto.randomUUID(),
      name: section,
      slug: section.toLowerCase().replace(/\s+/g, '-'),
      order: 10,
      active: true
    }).onConflictDoNothing();

    await tx.insert(schematics).values(data).onConflictDoUpdate({ target: schematics.id, set: data });

    await tx.delete(schematicApplicableModels).where(eq(schematicApplicableModels.schematicId, id));
    for (const modelId of body.applicableModelIds || []) {
      if (modelId && typeof modelId === 'string') {
        await tx.insert(schematicApplicableModels).values({ id: crypto.randomUUID(), schematicId: id, modelId }).onConflictDoNothing();
      }
    }

    await tx.delete(schematicHotspots).where(eq(schematicHotspots.schematicId, id));
    for (let i = 0; i < (body.hotspots || []).length; i++) {
      const hs = body.hotspots[i];
      if (hs && hs.itemNumber !== undefined) {
        await tx.insert(schematicHotspots).values({
          id: crypto.randomUUID(),
          schematicId: id,
          partId: hs.partId || null,
          itemNumber: String(hs.itemNumber),
          x: Number(hs.x || 0),
          y: Number(hs.y || 0),
          label: String(hs.label || `Pieza ${hs.itemNumber}`)
        }).onConflictDoNothing();
      }
    }
  });

  return data;
}

export async function upsertOrder(db: AppDb, body: any) {
  const rawId = body.id;
  const id = ensureUuid(rawId);
  let date = new Date();
  if (body.date) {
    const parsed = new Date(body.date);
    if (!isNaN(parsed.getTime())) date = parsed;
  }

  const settings = await getSiteSettings(db);
  const defaultLocation = {
    country: settings.defaultCountry,
    department: settings.defaultDepartment,
    city: settings.defaultCity
  };

  const data = {
    id,
    date,
    customerName: body.customerName || 'Cliente Suzuki',
    email: body.email || 'cliente@suzukiparts.com.co',
    phone: body.phone || '',
    documentId: body.documentId || '',
    country: body.country || defaultLocation.country,
    department: body.department || defaultLocation.department,
    city: body.city || defaultLocation.city,
    shippingAddress: body.shippingAddress || '',
    postalCode: body.postalCode || '',
    subtotal: body.subtotal ? Number(body.subtotal) : null,
    discount: body.discount ? Number(body.discount) : null,
    discountCode: body.discountCode || null,
    taxRate: body.taxRate ? Number(body.taxRate) : null,
    taxAmount: body.taxAmount ? Number(body.taxAmount) : null,
    totalPrice: Number(body.totalPrice || 0),
    shippingCost: Number(body.shippingCost || 0),
    shippingMethodName: body.shippingMethodName || null,
    motorcycle: body.motorcycle || null,
    guaranteeCode: body.guaranteeCode || `SZ-GAR-${Math.floor(1000 + Math.random() * 9000)}-PENDING`,
    paymentMethod: body.paymentMethod || 'transferencia',
    status: body.status || (await getDefaultStatusName(db)) || 'Pendiente de pago',
    paymentReference: body.paymentReference || id,
    trackingNumber: body.trackingNumber || null,
    shippingCarrier: body.shippingCarrier || null,
    trackingUrl: body.trackingUrl || null,
    notes: body.notes || '',
    prefix: settings.orderPrefix,
    documentNumber: normalizeDocumentNumber(body.documentNumber || (isValidUuid(rawId) ? String(Math.floor(100000 + Math.random() * 900000)) : rawId)),
    reservationExpiresAt: body.reservationExpiresAt ? new Date(body.reservationExpiresAt) : null,
    reservationStatus: body.reservationStatus || 'active',
    estimatedDeliveryMinDate: body.estimatedDeliveryMinDate || null,
    estimatedDeliveryMaxDate: body.estimatedDeliveryMaxDate || null,
    estimatedDeliveryFormatted: body.estimatedDeliveryFormatted || null
  };

  const reservationSettings = await getInventoryReservationSettings(db);

  await db.transaction(async (tx) => {
    const existingOrderRows = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
    const isNewOrder = existingOrderRows.length === 0;
    const previousOrder = isNewOrder ? null : existingOrderRows[0];

    const items = Array.isArray(body.items)
      ? body.items
      : (typeof body.items === 'string' ? parseJson(body.items, []) : []);

    // Resolve part IDs for all items first
    const resolvedItems: Array<{ partDbId: string | null; part: any; quantity: number; unitPrice: number; lineTotal: number; motorcycle: any }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const part = item.part || (item.partId ? { id: item.partId, name: item.partName || '', oemNumbers: item.oemNumber ? [item.oemNumber] : [] } : {});
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(part.price ?? item.unitPrice ?? 0);
      const lineTotal = Number(item.lineTotal ?? quantity * unitPrice);

      const rawPartId = part.id || item.partId || item.id;
      let partDbId: string | null = null;

      if (rawPartId && isValidUuid(rawPartId)) {
        partDbId = rawPartId;
      } else if (part.sku || item.sku) {
        const skuVal = part.sku || item.sku;
        const bySku = await tx.select({ id: parts.id }).from(parts).where(eq(parts.sku, skuVal)).limit(1);
        if (bySku.length > 0) partDbId = bySku[0].id;
      } else if (Array.isArray(part.oemNumbers) && part.oemNumbers.length > 0) {
        const oem = part.oemNumbers[0];
        if (typeof oem === 'string' && oem.trim()) {
          const byOem = await tx.select({ partId: partOemNumbers.partId }).from(partOemNumbers).where(eq(partOemNumbers.oemNumber, oem.trim())).limit(1);
          if (byOem.length > 0) partDbId = byOem[0].partId;
        }
      }

      resolvedItems.push({
        partDbId,
        part,
        quantity,
        unitPrice,
        lineTotal,
        motorcycle: item.motorcycle || null
      });
    }

    if (isNewOrder) {
      const pendingReservations: Array<{ partDbId: string; quantity: number; reservedStock: number; expiresAt: Date }> = [];

      if (reservationSettings.enabled && !isPaidOrderStatus(data.status)) {
        // Calculate TTL according to payment method
        const ttlMinutes = calculateReservationTtlMinutes(reservationSettings, data.paymentMethod);
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        data.reservationExpiresAt = expiresAt;
        data.reservationStatus = 'active';

        // Verify and lock stock with PostgreSQL pessimistic row-locking (FOR UPDATE)
        for (const it of resolvedItems) {
          if (!it.partDbId) continue;
          const partRows = await tx.select().from(parts).where(eq(parts.id, it.partDbId)).for('update');
          if (partRows.length === 0) {
            throw new Error(`El repuesto solicitado no fue encontrado en la base de datos.`);
          }
          const p = partRows[0];
          const totalStock = p.stock ?? 0;
          const reservedStock = p.stockReserved ?? 0;
          const availableStock = Math.max(0, totalStock - reservedStock);

          if (availableStock < it.quantity) {
            throw new Error(`Stock insuficiente para "${p.name}". Solicitado: ${it.quantity}, Disponible: ${availableStock} (Total: ${totalStock}, Reservado: ${reservedStock}).`);
          }

          pendingReservations.push({
            partDbId: it.partDbId,
            quantity: it.quantity,
            reservedStock,
            expiresAt
          });
        }
      }

      // 1. Insert order first to satisfy foreign key constraints on child tables
      await tx.insert(orders).values(data).onConflictDoUpdate({ target: orders.id, set: data });

      // 2. Insert reservations and update parts stock_reserved
      for (const res of pendingReservations) {
        await tx.update(parts).set({
          stockReserved: res.reservedStock + res.quantity
        }).where(eq(parts.id, res.partDbId));

        await tx.insert(stockReservations).values({
          id: crypto.randomUUID(),
          orderId: id,
          partId: res.partDbId,
          quantity: res.quantity,
          status: 'active',
          expiresAt: res.expiresAt,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // 3. Immediate physical deduction if order is already paid upon creation
      if (isPaidOrderStatus(data.status)) {
        data.reservationStatus = 'consumed';
        for (const it of resolvedItems) {
          if (!it.partDbId) continue;
          await recordInventoryMovement(tx, {
            partId: it.partDbId,
            movementType: 'OUT_SALE',
            quantity: -it.quantity,
            unitPrice: it.unitPrice,
            referenceType: 'order',
            referenceId: id,
            referenceDocument: (data.prefix || 'SZ-ORD') + '-' + (data.documentNumber || id.substring(0, 8).toUpperCase()),
            notes: `Venta directa en pedido ${(data.prefix || 'SZ-ORD')}-${data.documentNumber || id.substring(0, 8).toUpperCase()}`,
            userName: data.customerName
          });
        }
      }
    } else {
      // Existing order update: Check status transition
      if (previousOrder) {
        const wasPending = !isPaidOrderStatus(previousOrder.status) && !isCancelOrderStatus(previousOrder.status);
        const nowPaid = isPaidOrderStatus(data.status);
        const nowCancelled = isCancelOrderStatus(data.status);

        if (wasPending && nowPaid) {
          await consumeStockReservation(tx, id, 'Administrador');
          data.reservationStatus = 'consumed';
        } else if (wasPending && nowCancelled) {
          await releaseStockReservation(tx, id, `Estado cambiado a ${data.status}`, data.status, 'Administrador');
          data.reservationStatus = 'released';
        }
      }

      await tx.update(orders).set(data).where(eq(orders.id, id));
    }

    // Replace order items
    await tx.delete(orderItems).where(eq(orderItems.orderId, id));
    for (const it of resolvedItems) {
      await tx.insert(orderItems).values({
        id: crypto.randomUUID(),
        orderId: id,
        partId: it.partDbId || (isValidUuid(it.part.id) ? it.part.id : null),
        part: it.part,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        motorcycle: it.motorcycle || null
      }).onConflictDoNothing();
    }
  });

  return data;
}

export async function upsertUser(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  let createdAt = new Date();
  if (body.createdAt) {
    const parsed = new Date(body.createdAt);
    if (!isNaN(parsed.getTime())) createdAt = parsed;
  }

  let passwordHash: string | null = body.passwordHash || null;
  if (body.password) {
    passwordHash = hashPassword(body.password);
  }

  // If no password set yet for admin/superadmin or newly created user, assign standard default
  if (!passwordHash && !body.id) {
    passwordHash = hashPassword((body.role === 'admin' || body.role === 'superadmin') ? 'Admin2026!' : 'Suzuki2026!');
  }

  const data: any = {
    id,
    fullName: body.fullName,
    email: body.email,
    phone: body.phone,
    documentId: body.documentId,
    city: body.city,
    address: body.address,
    postalCode: body.postalCode || '',
    createdAt,
    avatarUrl: body.avatarUrl || null,
    role: body.role || 'customer',
    active: body.active !== undefined ? body.active : true,
    notes: body.notes || ''
  };

  if (passwordHash) {
    data.passwordHash = passwordHash;
  }

  await db.transaction(async (tx) => {
    // If updating, fetch existing passwordHash if not provided
    if (!data.passwordHash) {
      const existing = await tx.select().from(users).where(eq(users.id, id));
      if (existing.length > 0 && existing[0].passwordHash) {
        data.passwordHash = existing[0].passwordHash;
      } else {
        // Fallback default password if missing
        data.passwordHash = hashPassword((data.role === 'admin' || data.role === 'superadmin') ? 'Admin2026!' : 'Suzuki2026!');
      }
    }

    await tx.insert(users).values(data).onConflictDoUpdate({ target: users.id, set: data });

    await tx.delete(userFavorites).where(eq(userFavorites.userId, id));
    for (const partId of body.favoritePartIds || []) {
      if (partId && typeof partId === 'string') {
        await tx.insert(userFavorites).values({ id: crypto.randomUUID(), userId: id, partId, createdAt: new Date() }).onConflictDoNothing();
      }
    }

    // Persist permissions if provided or if user is admin
    if (Array.isArray(body.permissions)) {
      await tx.delete(userPermissions).where(eq(userPermissions.userId, id));
      for (const p of body.permissions) {
        if (p && p.module) {
          await tx.insert(userPermissions).values({
            id: ensureUuid(p.id),
            userId: id,
            module: p.module,
            canRead: p.canRead !== undefined ? Boolean(p.canRead) : true,
            canWrite: p.canWrite !== undefined ? Boolean(p.canWrite) : false,
            createdAt: new Date(),
            updatedAt: new Date()
          }).onConflictDoUpdate({
            target: [userPermissions.userId, userPermissions.module],
            set: {
              canRead: p.canRead !== undefined ? Boolean(p.canRead) : true,
              canWrite: p.canWrite !== undefined ? Boolean(p.canWrite) : false,
              updatedAt: new Date()
            }
          });
        }
      }
    }
  });

  return data;
}

export async function upsertShippingMethod(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const data = {
    id,
    name: body.name,
    carrier: body.carrier || (await getDefaultCarrierName(db)) || 'Servientrega',
    description: body.description || '',
    price: Number(body.price || 0),
    estimatedDays: Number(body.estimatedDays || 3),
    dispatchDays: Array.isArray(body.dispatchDays) ? body.dispatchDays : ['1', '2', '3', '4', '5'],
    freeShippingThreshold: body.freeShippingThreshold !== undefined && body.freeShippingThreshold !== null ? Number(body.freeShippingThreshold) : null,
    dispatchCutoff: body.dispatchCutoff || null,
    active: body.active !== undefined ? Boolean(body.active) : true,
    createdAt: body.createdAt ? new Date(body.createdAt) : new Date()
  };

  await db.transaction(async (tx) => {
    await tx.insert(shippingMethods).values(data).onConflictDoUpdate({ target: shippingMethods.id, set: data });

    await tx.delete(shippingMethodZoneRates).where(eq(shippingMethodZoneRates.methodId, id));
    for (const r of body.zoneRates || []) {
      if (r && r.zoneId) {
        const zoneId = await resolveZoneRef(tx as unknown as AppDb, r.zoneId);
        if (!zoneId) continue;
        await tx.insert(shippingMethodZoneRates).values({
          id: crypto.randomUUID(),
          methodId: id,
          zoneId,
          price: Number(r.price || 0)
        }).onConflictDoNothing();
      }
    }
  });

  return data;
}

export async function upsertShippingZone(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const data = {
    id,
    name: body.name,
    description: body.description || '',
    active: body.active !== undefined ? Boolean(body.active) : true,
    createdAt: body.createdAt ? new Date(body.createdAt) : new Date()
  };

  const depts = Array.isArray(body.departments) ? body.departments : [];

  await db.transaction(async (tx) => {
    await tx.insert(shippingZones).values(data).onConflictDoUpdate({ target: shippingZones.id, set: data });

    await tx.delete(shippingZoneStates).where(eq(shippingZoneStates.zoneId, id));
    await tx.delete(shippingZoneCities).where(eq(shippingZoneCities.zoneId, id));

    for (const dept of depts) {
      const name = typeof dept === 'string' ? dept : (dept && (dept.name || dept.id || dept.stateId));
      if (!name) continue;

      const cityList = (dept && typeof dept === 'object' && Array.isArray(dept.cities)) ? dept.cities : [];
      const stateId = await resolveStateRef(tx as unknown as AppDb, name);

      if (stateId && cityList.length === 0) {
        await tx.insert(shippingZoneStates).values({
          id: crypto.randomUUID(),
          zoneId: id,
          stateId
        }).onConflictDoNothing();
      } else if (stateId) {
        for (const cityRef of cityList) {
          const cityId = await resolveCityRef(tx as unknown as AppDb, stateId, cityRef);
          if (cityId) {
            await tx.insert(shippingZoneCities).values({
              id: crypto.randomUUID(),
              zoneId: id,
              cityId
            }).onConflictDoNothing();
          }
        }
      }
    }
  });

  return data;
}

function slugify(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============ 3NF Geography: Countries, States, Cities ============

export async function upsertCountry(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const data = {
    id,
    name: body.name,
    code: body.code || null,
    active: body.active !== undefined ? Boolean(body.active) : true
  };
  await db.insert(countries).values(data).onConflictDoUpdate({ target: countries.id, set: data });
  return data;
}

export async function upsertState(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const data = {
    id,
    countryId: body.countryId,
    name: body.name,
    code: body.code || null,
    active: body.active !== undefined ? Boolean(body.active) : true
  };
  await db.insert(states).values(data).onConflictDoUpdate({ target: states.id, set: data });
  return data;
}

export async function upsertCity(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const data = {
    id,
    stateId: body.stateId,
    name: body.name,
    code: body.code || null,
    active: body.active !== undefined ? Boolean(body.active) : true
  };
  await db.insert(cities).values(data).onConflictDoUpdate({ target: cities.id, set: data });
  return data;
}

export async function ensureCountry(db: AppDb, name: string): Promise<string> {
  const existing = await db.select().from(countries).where(eq(countries.name, name)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const saved = await upsertCountry(db, { name });
  return saved.id;
}

export async function ensureState(db: AppDb, countryId: string, name: string): Promise<string> {
  const existing = await db.select().from(states).where(and(eq(states.countryId, countryId), eq(states.name, name))).limit(1);
  if (existing.length > 0) return existing[0].id;
  const saved = await upsertState(db, { countryId, name });
  return saved.id;
}

export async function resolveStateRef(db: AppDb, ref: any): Promise<string | null> {
  if (!ref) return null;
  const value = typeof ref === 'object' && ref !== null ? ref.id || ref.stateId : ref;
  if (!value) return null;

  const byId = isValidUuid(value)
    ? await db.select().from(states).where(eq(states.id, value)).limit(1)
    : [];
  if (byId.length > 0) return byId[0].id;

  const byName = await db.select().from(states).where(eq(states.name, value)).limit(1);
  if (byName.length > 0) return byName[0].id;

  const countryId = await ensureCountry(db, STORE_DEFAULT_LOCATION.country);
  return ensureState(db, countryId, value);
}

export async function resolveCityRef(db: AppDb, stateId: string, ref: any): Promise<string | null> {
  if (!ref) return null;
  const value = typeof ref === 'object' && ref !== null ? ref.id || ref.cityId : ref;
  if (!value) return null;

  const byId = isValidUuid(value)
    ? await db.select().from(cities).where(eq(cities.id, value)).limit(1)
    : [];
  if (byId.length > 0) return byId[0].id;

  const byName = await db.select().from(cities).where(and(eq(cities.stateId, stateId), eq(cities.name, value))).limit(1);
  if (byName.length > 0) return byName[0].id;

  return null;
}

export async function resolveZoneRef(db: AppDb, ref: any): Promise<string | null> {
  if (!ref) return null;
  const value = typeof ref === 'object' && ref !== null ? ref.id || ref.zoneId : ref;
  if (!value) return null;

  const byId = isValidUuid(value)
    ? await db.select().from(shippingZones).where(eq(shippingZones.id, value)).limit(1)
    : [];
  if (byId.length > 0) return byId[0].id;

  const byName = await db.select().from(shippingZones).where(eq(shippingZones.name, value)).limit(1);
  if (byName.length > 0) return byName[0].id;

  // Legacy slug fallback (e.g. "zone-local"): match by the slug of the name
  const all = await db.select({ id: shippingZones.id, name: shippingZones.name }).from(shippingZones);
  const match = all.find((z) => slugify(z.name) === value);
  if (match) return match.id;

  return null;
}

export async function seedShipping(db: AppDb) {
  const zoneIdBySlug = new Map<string, string>();
  for (const zone of DEFAULT_SHIPPING_ZONES) {
    const existing = await db.select().from(shippingZones).where(eq(shippingZones.name, zone.name)).limit(1);
    const saved = await upsertShippingZone(db, { ...zone, id: existing.length > 0 ? existing[0].id : zone.id });
    zoneIdBySlug.set(zone.id, saved.id);
  }

  for (const sm of DEFAULT_SHIPPING_METHODS) {
    const existing = await db.select().from(shippingMethods).where(eq(shippingMethods.name, sm.name)).limit(1);
    const zoneRates = (sm.zoneRates || []).map((r) => ({
      ...r,
      zoneId: zoneIdBySlug.get(r.zoneId) || r.zoneId
    }));
    await upsertShippingMethod(db, { ...sm, id: existing.length > 0 ? existing[0].id : sm.id, zoneRates });
  }
  return { zones: DEFAULT_SHIPPING_ZONES.length, methods: DEFAULT_SHIPPING_METHODS.length };
}

export const DEFAULT_SCHEMATIC_SECTIONS = [
  { name: 'Motor', order: 1 },
  { name: 'Frenos', order: 2 },
  { name: 'Admisión y Combustible', order: 3 },
  { name: 'Transmisión y Kit de Arrastre', order: 4 },
  { name: 'Sistema de Refrigeración', order: 5 },
  { name: 'Chasis y Eléctrico', order: 6 },
  { name: 'Sistema de Escape', order: 7 },
  { name: 'Controles y Pedales', order: 8 },
  { name: 'Tablero e Instrumentos', order: 9 }
];

export async function upsertSchematicSection(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const data = {
    id,
    name: body.name,
    order: body.order ?? 0,
    active: body.active !== undefined ? Boolean(body.active) : true
  };
  await db.insert(schematicSections).values(data).onConflictDoUpdate({ target: schematicSections.id, set: data });
  return data;
}

export async function seedSchematicSections(db: AppDb) {
  for (const s of DEFAULT_SCHEMATIC_SECTIONS) {
    const existing = await db.select().from(schematicSections).where(eq(schematicSections.name, s.name)).limit(1);
    await upsertSchematicSection(db, existing.length > 0 ? { ...s, id: existing[0].id } : s);
  }
  return { sections: DEFAULT_SCHEMATIC_SECTIONS.length };
}

export const DEFAULT_ORDER_STATUSES = [
  { id: 'status-pending-payment', name: 'Pendiente de pago', color: 'amber', short: 'Pendiente', group: 'pending', is_default: true, order: 1 },
  { id: 'status-payment-confirmed', name: 'Pago confirmado', color: 'blue', short: 'Confirmado', group: 'paid', is_default: false, order: 2 },
  { id: 'status-shipped-warehouse', name: 'Despachado en Bodega Central', color: 'purple', short: 'Despachado', group: 'in_transit', is_default: false, order: 3 },
  { id: 'status-in-transit', name: 'En tránsito', color: 'indigo', short: 'En Tránsito', group: 'in_transit', is_default: false, order: 4 },
  { id: 'status-delivered', name: 'Entregado', color: 'emerald', short: 'Entregado', group: 'delivered', is_default: false, order: 5 },
  { id: 'status-cancelled', name: 'Cancelado', color: 'red', short: 'Cancelado', group: 'cancelled', is_default: false, order: 6 }
];

export const DEFAULT_CARRIERS = [
  { id: 'carrier-servientrega', name: 'Servientrega', is_default: true, order: 1 },
  { id: 'carrier-deprisa', name: 'Deprisa', is_default: false, order: 2 },
  { id: 'carrier-encoexpress', name: 'Encoexpress', is_default: false, order: 3 },
  { id: 'carrier-interrapidismo', name: 'Interrapidísimo', is_default: false, order: 4 },
  { id: 'carrier-coordinadora', name: 'Coordinadora', is_default: false, order: 5 },
  { id: 'carrier-envia-colvanes', name: 'Envía Colvanes', is_default: false, order: 6 },
  { id: 'carrier-inter-rapidismo', name: 'Inter Rapidísimo', is_default: false, order: 7 },
  { id: 'carrier-envia', name: 'Envía', is_default: false, order: 8 },
  { id: 'carrier-tcc', name: 'TCC', is_default: false, order: 9 },
  { id: 'carrier-retiro-tienda', name: 'Retiro en tienda', is_default: false, order: 10 },
  { id: 'carrier-otro', name: 'Otro / Transportadora local', is_default: false, order: 11 }
];

export async function getDefaultStatusName(db: AppDb) {
  const rows = await db.select().from(orderStatuses).where(eq(orderStatuses.is_default, true)).limit(1);
  return rows[0]?.name || null;
}

export async function getDefaultCarrierName(db: AppDb) {
  const rows = await db.select().from(carriers).where(eq(carriers.is_default, true)).limit(1);
  return rows[0]?.name || null;
}

export async function upsertOrderStatus(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const data = {
    id,
    name: body.name,
    color: body.color || 'slate',
    short: body.short || null,
    group: body.group || null,
    is_default: body.is_default !== undefined ? Boolean(body.is_default) : false,
    order: body.order ?? 0,
    active: body.active !== undefined ? Boolean(body.active) : true
  };
  await db.insert(orderStatuses).values(data).onConflictDoUpdate({ target: orderStatuses.id, set: data });
  return data;
}

export async function upsertCarrier(db: AppDb, body: any) {
  const id = ensureUuid(body.id);
  const data = {
    id,
    name: body.name,
    is_default: body.is_default !== undefined ? Boolean(body.is_default) : false,
    order: body.order ?? 0,
    active: body.active !== undefined ? Boolean(body.active) : true
  };
  await db.insert(carriers).values(data).onConflictDoUpdate({ target: carriers.id, set: data });
  return data;
}

export async function seedOrderStatuses(db: AppDb) {
  for (const s of DEFAULT_ORDER_STATUSES) {
    const existing = await db.select().from(orderStatuses).where(eq(orderStatuses.name, s.name)).limit(1);
    await upsertOrderStatus(db, { ...s, id: existing.length > 0 ? existing[0].id : s.id });
  }
  return { statuses: DEFAULT_ORDER_STATUSES.length };
}

export async function seedCarriers(db: AppDb) {
  for (const c of DEFAULT_CARRIERS) {
    const existing = await db.select().from(carriers).where(eq(carriers.name, c.name)).limit(1);
    await upsertCarrier(db, { ...c, id: existing.length > 0 ? existing[0].id : c.id });
  }
  return { carriers: DEFAULT_CARRIERS.length };
}

export const DEFAULT_MODEL_CATEGORIES = [
  { id: 'cat-naked-sport', name: 'Naked / Sport', order: 1 },
  { id: 'cat-sport-fairing', name: 'Sport / Fairing', order: 2 },
  { id: 'cat-superbike', name: 'Superbike', order: 3 },
  { id: 'cat-adventure-tourer', name: 'Adventure / Tourer', order: 4 },
  { id: 'cat-dual-sport-enduro', name: 'Dual Sport / Enduro', order: 5 },
  { id: 'cat-custom-commuter', name: 'Custom / Commuter', order: 6 },
  { id: 'cat-scooter', name: 'Scooter', order: 7 },
  { id: 'cat-off-road-motocross', name: 'Off-Road / Motocross', order: 8 }
];

export async function upsertModelCategory(db: AppDb, body: any) {
  const id = body.id || `cat-${body.name.toLowerCase().replace(/\s+/g, '-')}`;
  const data = {
    id,
    name: body.name,
    order: body.order ?? 0,
    active: body.active !== undefined ? Boolean(body.active) : true
  };
  await db.insert(modelCategories).values(data).onConflictDoUpdate({ target: modelCategories.id, set: data });
  return data;
}

export async function seedModelCategories(db: AppDb) {
  for (const c of DEFAULT_MODEL_CATEGORIES) {
    const existing = await db.select().from(modelCategories).where(eq(modelCategories.name, c.name)).limit(1);
    await upsertModelCategory(db, { ...c, id: existing.length > 0 ? existing[0].id : c.id });
  }
  return { categories: DEFAULT_MODEL_CATEGORIES.length };
}

export async function seedGeography(db: AppDb) {
  const colombiaId = await ensureCountry(db, STORE_DEFAULT_LOCATION.country);

  for (const dept of COLOMBIAN_DEPARTMENTS) {
    await ensureState(db, colombiaId, dept);
  }

  for (const c of DEFAULT_COLOMBIAN_CITIES) {
    const stateId = await ensureState(db, colombiaId, c.department);
    await upsertCity(db, {
      id: c.id,
      stateId,
      name: c.city,
      code: c.code,
      active: c.active
    });
  }

  return { countryId: colombiaId };
}

export async function upsertOrderReturn(db: AppDb, body: any) {
  const rawId = body.id;
  const id = ensureUuid(rawId);
  const date = body.createdAt ? new Date(body.createdAt) : new Date();

  // Auto generate Store Credit Code if resolution is store_credit and none exists
  let storeCreditCode = body.storeCreditCode || null;
  const bonusAmount = Number(body.bonusAmount || 0);
  const refundAmount = Number(body.refundAmount || 0);

  if (body.resolutionType === 'store_credit' && !storeCreditCode && (body.status === 'Aprobada' || body.status === 'Reembolsada' || body.status === 'Pieza recibida')) {
    storeCreditCode = `SZ-CREDIT-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const data: any = {
    id,
    orderId: body.orderId,
    customerName: body.customerName,
    email: body.email,
    phone: body.phone || '',
    documentId: body.documentId || '',
    reason: body.reason || 'Devolución de repuesto',
    resolutionType: body.resolutionType || 'refund',
    isPreDispatchCancel: Boolean(body.isPreDispatchCancel),
    isUnpaidCancel: Boolean(body.isUnpaidCancel),
    replacementPartId: isValidUuid(body.replacementPartId) ? body.replacementPartId : null,
    storeCreditCode,
    bonusAmount,
    status: (Boolean(body.isUnpaidCancel) || Boolean(body.isPreDispatchCancel) || body.resolutionType === 'cancellation') ? 'Aprobada' : (body.status || 'Pendiente'),
    qcStatus: body.qcStatus || 'pending',
    qcNotes: body.qcNotes || '',
    refundAmount,
    refundMethod: body.refundMethod || null,
    refundReference: body.refundReference || null,
    returnCarrier: body.returnCarrier || null,
    returnTrackingNumber: body.returnTrackingNumber || null,
    restockInventory: Boolean(body.restockInventory),
    evidencePhotos: Array.isArray(body.evidencePhotos) ? body.evidencePhotos : (typeof body.evidencePhotos === 'string' ? parseJson(body.evidencePhotos, []) : []),
    itemDetailsJson: Array.isArray(body.itemDetailsJson) ? body.itemDetailsJson : (typeof body.itemDetailsJson === 'string' ? parseJson(body.itemDetailsJson, []) : []),
    itemsJson: Array.isArray(body.itemsJson) ? body.itemsJson : (typeof body.itemsJson === 'string' ? parseJson(body.itemsJson, []) : []),
    notes: body.notes || '',
    prefix: (await getSiteSettings(db)).returnPrefix,
    documentNumber: normalizeDocumentNumber(body.documentNumber || (isValidUuid(rawId) ? null : rawId)),
    createdAt: date,
    updatedAt: new Date()
  };

  await db.transaction(async (tx) => {
    await tx.insert(orderReturns).values(data).onConflictDoUpdate({ target: orderReturns.id, set: data });

    // Automatically mark the order as Cancelado in DB if it's an unpaid cancellation or pre-dispatch cancel
    if (data.isUnpaidCancel || data.isPreDispatchCancel || data.resolutionType === 'cancellation') {
      await releaseStockReservation(tx, data.orderId, 'Cancelación / Desistimiento de pedido', 'Cancelado', data.customerName || 'Cliente');
      await tx.update(orders).set({ status: 'Cancelado' }).where(eq(orders.id, data.orderId));
    }

    // Handle inventory restocking if switch is enabled and QC passed or status approved
    if (data.restockInventory && (data.qcStatus === 'passed' || data.status === 'Reembolsada' || data.status === 'Pieza recibida')) {
      const items = (data.itemDetailsJson && data.itemDetailsJson.length > 0) ? data.itemDetailsJson : (data.itemsJson || []);
      const existingRetMovements = await tx.select({ id: inventoryMovements.id }).from(inventoryMovements).where(and(eq(inventoryMovements.referenceType, 'return'), eq(inventoryMovements.referenceId, data.id))).limit(1);

      if (existingRetMovements.length === 0) {
        for (const item of items) {
          const partId = item.partId || item.id;
          const qty = Number(item.quantity || 1);
          if (partId && isValidUuid(partId)) {
            await recordInventoryMovement(tx, {
              partId,
              movementType: 'IN_RETURN',
              quantity: qty,
              unitPrice: Number(item.price || 0),
              referenceType: 'return',
              referenceId: data.id,
              referenceDocument: (data.prefix || 'SZ-RET') + '-' + (data.documentNumber || data.id.substring(0, 8).toUpperCase()),
              notes: `Reintegro por devolución RMA ${(data.prefix || 'SZ-RET')}-${data.documentNumber || data.id.substring(0, 8).toUpperCase()}`,
              userName: data.customerName
            });
          }
        }
      }
    }
  });

  return data;
}

export async function getSiteSettings(db: AppDb): Promise<SiteSettings> {
  let rows: any[] = [];
  try {
    rows = await db.select().from(siteSettings);
  } catch {}

  const settingsMap = new Map<string, any>();
  for (const r of rows) {
    settingsMap.set(r.key, r.value);
  }

  const info = settingsMap.get('store.info') || {};
  const location = settingsMap.get('store.location') || {};
  const tax = settingsMap.get('store.tax') || {};
  const returns = settingsMap.get('store.returns') || {};
  const documents = settingsMap.get('store.documents') || {};
  const social = settingsMap.get('store.social') || {};
  const footer = settingsMap.get('store.footer') || {};
  const product = settingsMap.get('store.product') || {};
  const specsConfig = settingsMap.get('store.specs') || {};
  const shipping = settingsMap.get('store.shipping') || {};
  const defaultSpecs = Array.isArray(specsConfig.defaultSpecs) ? specsConfig.defaultSpecs : [];

  return {
    id: 'default',
    storeName: info.storeName || STORE_BOOTSTRAP.storeName,
    storeLogo: info.storeLogo || STORE_BOOTSTRAP.storeLogo,
    storeTagline: info.storeTagline || STORE_BOOTSTRAP.storeTagline,
    whatsappNumber: info.whatsappNumber || STORE_BOOTSTRAP.whatsappNumber,
    contactEmail: info.contactEmail || STORE_BOOTSTRAP.contactEmail,
    storeAddress: info.storeAddress || STORE_BOOTSTRAP.storeAddress,
    showProductImages: typeof info.showProductImages === 'boolean' ? info.showProductImages : getBootstrapShowProductImages(),
    detailPrimary: product.detailPrimary === 'images' ? 'images' : 'despiece',
    showPartSchematicOnCard: typeof product.showPartSchematicOnCard === 'boolean' ? product.showPartSchematicOnCard : false,
    defaultCountry: location.defaultCountry || STORE_BOOTSTRAP.location.country,
    defaultDepartment: location.defaultDepartment || STORE_BOOTSTRAP.location.department,
    defaultCity: location.defaultCity || STORE_BOOTSTRAP.location.city,
    taxName: tax.taxName || 'IVA Colombia',
    taxRate: typeof tax.taxRate === 'number' ? tax.taxRate : 19,
    taxActive: typeof tax.taxActive === 'boolean' ? tax.taxActive : true,
    returnMaxDays: typeof returns.returnMaxDays === 'number' ? returns.returnMaxDays : 30,
    orderPrefix: typeof documents.orderPrefix === 'string' && documents.orderPrefix.trim() ? documents.orderPrefix.trim() : 'SZ-ORD',
    returnPrefix: typeof documents.returnPrefix === 'string' && documents.returnPrefix.trim() ? documents.returnPrefix.trim() : 'SZ-RET',
    defaultSpecs,
    shippingWorkingDaysMode: (shipping.workingDaysMode as any) || STORE_BOOTSTRAP.shipping.workingDaysMode,
    shippingInStockMinDays: typeof shipping.inStockMinDays === 'number' ? shipping.inStockMinDays : STORE_BOOTSTRAP.shipping.inStockMinDays,
    shippingInStockMaxDays: typeof shipping.inStockMaxDays === 'number' ? shipping.inStockMaxDays : STORE_BOOTSTRAP.shipping.inStockMaxDays,
    shippingInternationalMinDays: typeof shipping.internationalMinDays === 'number' ? shipping.internationalMinDays : STORE_BOOTSTRAP.shipping.internationalMinDays,
    shippingInternationalMaxDays: typeof shipping.internationalMaxDays === 'number' ? shipping.internationalMaxDays : STORE_BOOTSTRAP.shipping.internationalMaxDays,
    shippingOnOrderMinDays: typeof shipping.onOrderMinDays === 'number' ? shipping.onOrderMinDays : STORE_BOOTSTRAP.shipping.onOrderMinDays,
    shippingOnOrderMaxDays: typeof shipping.onOrderMaxDays === 'number' ? shipping.onOrderMaxDays : STORE_BOOTSTRAP.shipping.onOrderMaxDays,
    shippingMixedPolicy: typeof shipping.mixedPolicy === 'string' && shipping.mixedPolicy.trim() ? shipping.mixedPolicy.trim() : STORE_BOOTSTRAP.shipping.mixedPolicy,
    socialLinks: { ...STORE_BOOTSTRAP.socialLinks, ...social },
    footerConfig: { ...FOOTER_BOOTSTRAP, ...footer },
    updatedAt: new Date().toISOString()
  } as unknown as SiteSettings;
}

export async function upsertSiteSettings(db: AppDb, body: any) {
  const existing = await getSiteSettings(db);

  const info = {
    storeName: typeof body.storeName === 'string' ? body.storeName.trim() : existing.storeName,
    storeLogo: typeof body.storeLogo === 'string' ? body.storeLogo.trim() : existing.storeLogo,
    storeTagline: typeof body.storeTagline === 'string' ? body.storeTagline.trim() : existing.storeTagline,
    whatsappNumber: typeof body.whatsappNumber === 'string' ? body.whatsappNumber.trim() : existing.whatsappNumber,
    contactEmail: typeof body.contactEmail === 'string' ? body.contactEmail.trim() : existing.contactEmail,
    storeAddress: typeof body.storeAddress === 'string' ? body.storeAddress.trim() : existing.storeAddress,
    showProductImages: typeof body.showProductImages === 'boolean' ? body.showProductImages : existing.showProductImages,
  };

  const location = {
    defaultCountry: typeof body.defaultCountry === 'string' ? body.defaultCountry : existing.defaultCountry,
    defaultDepartment: typeof body.defaultDepartment === 'string' ? body.defaultDepartment : existing.defaultDepartment,
    defaultCity: typeof body.defaultCity === 'string' ? body.defaultCity : existing.defaultCity,
  };

  const taxActive = typeof body.taxActive === 'boolean' ? body.taxActive
    : (typeof body.active === 'boolean' ? body.active : existing.taxActive);
  const tax = {
    taxName: typeof body.taxName === 'string' ? body.taxName : existing.taxName,
    taxRate: typeof body.taxRate === 'number' ? body.taxRate : existing.taxRate,
    taxActive,
  };

  const returns = {
    returnMaxDays: typeof body.returnMaxDays === 'number' ? body.returnMaxDays : existing.returnMaxDays,
  };

  const documents = {
    orderPrefix: typeof body.orderPrefix === 'string' && body.orderPrefix.trim() ? body.orderPrefix.trim() : existing.orderPrefix,
    returnPrefix: typeof body.returnPrefix === 'string' && body.returnPrefix.trim() ? body.returnPrefix.trim() : existing.returnPrefix,
  };

  const defaultSpecs = Array.isArray(body.defaultSpecs)
    ? body.defaultSpecs
        .filter((s: any) => s && typeof s.label === 'string' && s.label.trim().length > 0)
        .map((s: any) => ({
          label: s.label.trim(),
          defaultValue: typeof s.defaultValue === 'string' ? s.defaultValue.trim() : ''
        }))
    : (existing.defaultSpecs ?? []);

  const specs = {
    defaultSpecs,
  };

  const shipping = {
    workingDaysMode: typeof body.shippingWorkingDaysMode === 'string' && body.shippingWorkingDaysMode ? body.shippingWorkingDaysMode : (existing.shippingWorkingDaysMode || STORE_BOOTSTRAP.shipping.workingDaysMode),
    inStockMinDays: typeof body.shippingInStockMinDays === 'number' ? body.shippingInStockMinDays : (existing.shippingInStockMinDays ?? STORE_BOOTSTRAP.shipping.inStockMinDays),
    inStockMaxDays: typeof body.shippingInStockMaxDays === 'number' ? body.shippingInStockMaxDays : (existing.shippingInStockMaxDays ?? STORE_BOOTSTRAP.shipping.inStockMaxDays),
    internationalMinDays: typeof body.shippingInternationalMinDays === 'number' ? body.shippingInternationalMinDays : (existing.shippingInternationalMinDays ?? STORE_BOOTSTRAP.shipping.internationalMinDays),
    internationalMaxDays: typeof body.shippingInternationalMaxDays === 'number' ? body.shippingInternationalMaxDays : (existing.shippingInternationalMaxDays ?? STORE_BOOTSTRAP.shipping.internationalMaxDays),
    onOrderMinDays: typeof body.shippingOnOrderMinDays === 'number' ? body.shippingOnOrderMinDays : (existing.shippingOnOrderMinDays ?? STORE_BOOTSTRAP.shipping.onOrderMinDays),
    onOrderMaxDays: typeof body.shippingOnOrderMaxDays === 'number' ? body.shippingOnOrderMaxDays : (existing.shippingOnOrderMaxDays ?? STORE_BOOTSTRAP.shipping.onOrderMaxDays),
    mixedPolicy: typeof body.shippingMixedPolicy === 'string' && body.shippingMixedPolicy.trim() ? body.shippingMixedPolicy.trim() : (existing.shippingMixedPolicy || STORE_BOOTSTRAP.shipping.mixedPolicy),
  };

  const social = body.socialLinks && typeof body.socialLinks === 'object'
    ? body.socialLinks
    : (existing.socialLinks ?? {});

  const footer = body.footerConfig && typeof body.footerConfig === 'object'
    ? body.footerConfig
    : (existing.footerConfig ?? {});

  const product = {
    detailPrimary: body.detailPrimary === 'images' ? 'images' : 'despiece',
    showPartSchematicOnCard: typeof body.showPartSchematicOnCard === 'boolean' ? body.showPartSchematicOnCard : (existing.showPartSchematicOnCard ?? false),
  };

  const modules = [
    { key: 'store.info', value: info, category: 'general', description: 'Información general de la tienda' },
    { key: 'store.location', value: location, category: 'logistics', description: 'Ubicación y cobertura por defecto' },
    { key: 'store.tax', value: tax, category: 'billing', description: 'Configuración de impuestos y tasas' },
    { key: 'store.returns', value: returns, category: 'logistics', description: 'Políticas de garantía y devoluciones' },
    { key: 'store.documents', value: documents, category: 'general', description: 'Prefijos de numeración de pedidos y devoluciones' },
    { key: 'store.specs', value: specs, category: 'catalog', description: 'Especificaciones técnicas por defecto para repuestos' },
    { key: 'store.shipping', value: shipping, category: 'logistics', description: 'Tiempos de entrega y políticas de despacho' },
    { key: 'store.social', value: social, category: 'social', description: 'Enlaces a redes sociales y canales de atención' },
    { key: 'store.footer', value: footer, category: 'general', description: 'Pie de página y avisos legales' },
    { key: 'store.product', value: product, category: 'general', description: 'Elemento principal mostrado en el detalle de producto' },
  ];

  await db.transaction(async (tx) => {
    for (const mod of modules) {
      await tx.insert(siteSettings).values({
        id: crypto.randomUUID(),
        key: mod.key,
        value: mod.value,
        category: mod.category,
        description: mod.description,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: mod.value,
          category: mod.category,
          description: mod.description,
          updatedAt: new Date()
        }
      });
    }
  });

  return getSiteSettings(db);
}

export async function deleteOrderReturn(db: AppDb, id: string) {
  await db.delete(orderReturns).where(eq(orderReturns.id, id));
  return { id };
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  bankTransfer: {
    enabled: true,
    accounts: []
  },
  wompi: {
    enabled: false,
    environment: 'sandbox',
    publicKey: '',
    privateKey: '',
    integritySecret: '',
    eventsSecret: ''
  }
};

export async function getPaymentSettings(db: AppDb): Promise<PaymentSettings> {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'store.payments')).limit(1);
    if (rows.length > 0 && rows[0].value) {
      const val = rows[0].value as any;
      return {
        bankTransfer: {
          enabled: typeof val.bankTransfer?.enabled === 'boolean' ? val.bankTransfer.enabled : DEFAULT_PAYMENT_SETTINGS.bankTransfer.enabled,
          accounts: Array.isArray(val.bankTransfer?.accounts) ? val.bankTransfer.accounts : DEFAULT_PAYMENT_SETTINGS.bankTransfer.accounts
        },
        wompi: {
          enabled: typeof val.wompi?.enabled === 'boolean' ? val.wompi.enabled : DEFAULT_PAYMENT_SETTINGS.wompi.enabled,
          environment: val.wompi?.environment === 'production' ? 'production' : 'sandbox',
          publicKey: typeof val.wompi?.publicKey === 'string' ? val.wompi.publicKey.trim() : '',
          privateKey: typeof val.wompi?.privateKey === 'string' ? val.wompi.privateKey.trim() : '',
          integritySecret: typeof val.wompi?.integritySecret === 'string' ? val.wompi.integritySecret.trim() : '',
          eventsSecret: typeof val.wompi?.eventsSecret === 'string' ? val.wompi.eventsSecret.trim() : ''
        }
      };
    }
  } catch (err) {
    console.error('Error cargando payment_settings de la BD:', err);
  }
  return DEFAULT_PAYMENT_SETTINGS;
}

export async function upsertPaymentSettings(db: AppDb, body: any): Promise<PaymentSettings> {
  const current = await getPaymentSettings(db);

  const bankTransfer = {
    enabled: typeof body?.bankTransfer?.enabled === 'boolean' ? body.bankTransfer.enabled : current.bankTransfer.enabled,
    accounts: Array.isArray(body?.bankTransfer?.accounts)
      ? body.bankTransfer.accounts.map((acc: any) => ({
          id: acc.id || crypto.randomUUID(),
          bankName: String(acc.bankName || '').trim(),
          accountType: String(acc.accountType || 'Cuenta de Ahorros').trim(),
          accountNumber: String(acc.accountNumber || '').trim(),
          accountHolder: String(acc.accountHolder || '').trim(),
          nit: String(acc.nit || '').trim(),
          instructions: typeof acc.instructions === 'string' ? acc.instructions.trim() : '',
          active: typeof acc.active === 'boolean' ? acc.active : true,
          isDefault: typeof acc.isDefault === 'boolean' ? acc.isDefault : false
        }))
      : current.bankTransfer.accounts
  };

  const wompi: WompiConfig = {
    enabled: typeof body?.wompi?.enabled === 'boolean' ? body.wompi.enabled : current.wompi.enabled,
    environment: body?.wompi?.environment === 'production' ? 'production' : 'sandbox',
    publicKey: typeof body?.wompi?.publicKey === 'string' ? body.wompi.publicKey.trim() : current.wompi.publicKey,
    privateKey: typeof body?.wompi?.privateKey === 'string' ? body.wompi.privateKey.trim() : current.wompi.privateKey,
    integritySecret: typeof body?.wompi?.integritySecret === 'string' ? body.wompi.integritySecret.trim() : current.wompi.integritySecret,
    eventsSecret: typeof body?.wompi?.eventsSecret === 'string' ? body.wompi.eventsSecret.trim() : current.wompi.eventsSecret
  };

  const value: PaymentSettings = { bankTransfer, wompi };

  await db.insert(siteSettings).values({
    id: crypto.randomUUID(),
    key: 'store.payments',
    value,
    category: 'billing',
    description: 'Configuración de medios de pago (Transferencias Bancarias y Pasarela Wompi)',
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: siteSettings.key,
    set: {
      value,
      category: 'billing',
      description: 'Configuración de medios de pago (Transferencias Bancarias y Pasarela Wompi)',
      updatedAt: new Date()
    }
  });

  return getPaymentSettings(db);
}

// ============ 20. Kardex & Inventory Movements Management ============

export interface RecordMovementParams {
  partId: string;
  movementType: 'INITIAL_STOCK' | 'OUT_SALE' | 'IN_CANCEL' | 'IN_RETURN' | 'IN_PURCHASE' | 'OUT_DAMAGE' | 'OUT_INTERNAL' | 'ADJUST_IN' | 'ADJUST_OUT';
  quantity: number; // positive for IN, negative for OUT
  unitCost?: number;
  unitPrice?: number;
  referenceType?: 'order' | 'return' | 'manual_adjustment' | 'supplier_invoice' | 'initial_balance';
  referenceId?: string | null;
  referenceDocument?: string | null;
  notes?: string;
  userId?: string | null;
  userName?: string;
  createdAt?: Date;
}

export async function recordInventoryMovement(txOrDb: any, params: RecordMovementParams) {
  const partRows = await txOrDb.select().from(parts).where(eq(parts.id, params.partId)).limit(1);
  if (partRows.length === 0) {
    throw new Error(`Repuesto con ID ${params.partId} no encontrado para registrar movimiento en Kardex`);
  }

  const part = partRows[0];
  const previousStock = part.stock ?? 0;
  const currentCost = part.cost ?? 0;
  const currentPrice = part.price ?? 0;

  const rawQty = Number(params.quantity);
  let qty = rawQty;
  const isOut = ['OUT_SALE', 'OUT_DAMAGE', 'OUT_INTERNAL', 'ADJUST_OUT'].includes(params.movementType);
  if (isOut && qty > 0) {
    qty = -qty;
  } else if (!isOut && qty < 0 && params.movementType !== 'ADJUST_OUT') {
    qty = Math.abs(qty);
  }

  const resultingStock = Math.max(0, previousStock + qty);
  const unitCost = params.unitCost !== undefined && params.unitCost >= 0 ? Number(params.unitCost) : currentCost;
  const unitPrice = params.unitPrice !== undefined && params.unitPrice >= 0 ? Number(params.unitPrice) : currentPrice;

  // Recalculate weighted average cost on positive stock additions with specified cost
  let newCost = currentCost;
  if (qty > 0 && params.unitCost !== undefined && params.unitCost > 0) {
    if (previousStock <= 0) {
      newCost = unitCost;
    } else {
      newCost = ((previousStock * currentCost) + (qty * unitCost)) / resultingStock;
    }
  }

  const totalAmount = Math.abs(qty) * (unitCost > 0 ? unitCost : unitPrice);

  const movementData = {
    id: crypto.randomUUID(),
    partId: params.partId,
    movementType: params.movementType,
    quantity: qty,
    previousStock,
    resultingStock,
    unitCost,
    unitPrice,
    totalAmount,
    referenceType: params.referenceType || 'manual_adjustment',
    referenceId: params.referenceId || null,
    referenceDocument: params.referenceDocument || null,
    notes: params.notes || '',
    userId: params.userId && isValidUuid(params.userId) ? params.userId : null,
    userName: params.userName || 'Sistema',
    createdAt: params.createdAt || new Date()
  };

  await txOrDb.insert(inventoryMovements).values(movementData);

  // Update part stock and cost atomically
  await txOrDb.update(parts).set({
    stock: resultingStock,
    cost: newCost
  }).where(eq(parts.id, params.partId));

  return movementData;
}

export async function initializeKardexBalances(db: AppDb) {
  const allParts = await db.select().from(parts);
  const existingMovements = await db.select({ partId: inventoryMovements.partId }).from(inventoryMovements);
  const partsWithMovements = new Set(existingMovements.map(m => m.partId));

  const toInitialize = allParts.filter(p => !partsWithMovements.has(p.id));
  if (toInitialize.length === 0) return { initialized: 0 };

  await db.transaction(async (tx) => {
    for (const part of toInitialize) {
      const stock = part.stock ?? 0;
      const cost = part.cost || (part.price ? part.price * 0.6 : 0);
      await tx.insert(inventoryMovements).values({
        id: crypto.randomUUID(),
        partId: part.id,
        movementType: 'INITIAL_STOCK',
        quantity: stock,
        previousStock: 0,
        resultingStock: stock,
        unitCost: cost,
        unitPrice: part.price ?? 0,
        totalAmount: stock * cost,
        referenceType: 'initial_balance',
        referenceId: null,
        referenceDocument: 'SALDO-INICIAL',
        notes: 'Carga inicial de apertura de Kardex',
        userName: 'Sistema',
        createdAt: new Date()
      });
      if (!part.cost && cost > 0) {
        await tx.update(parts).set({ cost }).where(eq(parts.id, part.id));
      }
    }
  });

  return { initialized: toInitialize.length };
}

export async function upsertInventoryMovement(db: AppDb, body: any) {
  if (!body.partId) throw new Error('El ID del repuesto (partId) es requerido');
  if (!body.movementType) throw new Error('El tipo de movimiento (movementType) es requerido');
  if (body.quantity === undefined || Number(body.quantity) === 0) throw new Error('La cantidad debe ser distinta de cero');

  let result: any = null;
  await db.transaction(async (tx) => {
    result = await recordInventoryMovement(tx, {
      partId: body.partId,
      movementType: body.movementType,
      quantity: Number(body.quantity),
      unitCost: body.unitCost !== undefined ? Number(body.unitCost) : undefined,
      unitPrice: body.unitPrice !== undefined ? Number(body.unitPrice) : undefined,
      referenceType: body.referenceType || 'manual_adjustment',
      referenceId: body.referenceId || null,
      referenceDocument: body.referenceDocument || null,
      notes: body.notes || '',
      userId: body.userId || null,
      userName: body.userName || 'Admin',
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date()
    });
  });

  return result;
}

export async function deleteInventoryMovement(db: AppDb, id: string) {
  await db.delete(inventoryMovements).where(eq(inventoryMovements.id, id));
  return { id };
}

// ==========================================
// INVENTORY RESERVATIONS & TTL SETTINGS
// ==========================================

export const DEFAULT_INVENTORY_RESERVATION_SETTINGS: InventoryReservationSettings = {
  enabled: true,
  defaultTtlMinutes: 60,
  paymentMethodTtl: {
    transferencia: 720, // 12 hours
    bancolombia: 720,
    davivienda: 720,
    nequi: 120,        // 2 hours
    daviplata: 120,    // 2 hours
    wompi: 30,         // 30 mins
    tarjeta: 30,       // 30 mins
    pse: 30,           // 30 mins
    contraentrega: 1440 // 24 hours
  },
  expiryAction: 'cancel'
};

export async function getInventoryReservationSettings(db: AppDb): Promise<InventoryReservationSettings> {
  try {
    const row = await db.select().from(siteSettings).where(eq(siteSettings.key, 'inventory.reservations')).limit(1);
    if (row.length > 0 && row[0].value) {
      const val = typeof row[0].value === 'string' ? JSON.parse(row[0].value) : row[0].value;
      return {
        enabled: typeof val.enabled === 'boolean' ? val.enabled : DEFAULT_INVENTORY_RESERVATION_SETTINGS.enabled,
        defaultTtlMinutes: typeof val.defaultTtlMinutes === 'number' && val.defaultTtlMinutes > 0 ? val.defaultTtlMinutes : DEFAULT_INVENTORY_RESERVATION_SETTINGS.defaultTtlMinutes,
        paymentMethodTtl: { ...DEFAULT_INVENTORY_RESERVATION_SETTINGS.paymentMethodTtl, ...(val.paymentMethodTtl || {}) },
        expiryAction: val.expiryAction === 'expire' ? 'expire' : 'cancel'
      };
    }
  } catch (err) {
    console.error('Error fetching inventory reservation settings:', err);
  }
  return DEFAULT_INVENTORY_RESERVATION_SETTINGS;
}

export async function upsertInventoryReservationSettings(db: AppDb, body: Partial<InventoryReservationSettings>): Promise<InventoryReservationSettings> {
  const current = await getInventoryReservationSettings(db);
  const updated: InventoryReservationSettings = {
    enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
    defaultTtlMinutes: typeof body.defaultTtlMinutes === 'number' && body.defaultTtlMinutes > 0 ? body.defaultTtlMinutes : current.defaultTtlMinutes,
    paymentMethodTtl: body.paymentMethodTtl ? { ...current.paymentMethodTtl, ...body.paymentMethodTtl } : current.paymentMethodTtl,
    expiryAction: body.expiryAction === 'expire' ? 'expire' : 'cancel'
  };

  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, 'inventory.reservations')).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettings).set({
      value: updated,
      updatedAt: new Date()
    }).where(eq(siteSettings.key, 'inventory.reservations'));
  } else {
    await db.insert(siteSettings).values({
      id: crypto.randomUUID(),
      key: 'inventory.reservations',
      value: updated,
      category: 'inventory',
      description: 'Configuración de retención temporal y TTL de reservas de inventario',
      updatedAt: new Date()
    });
  }

  return updated;
}

export function calculateReservationTtlMinutes(settings: InventoryReservationSettings, paymentMethod?: string): number {
  if (!paymentMethod) return settings.defaultTtlMinutes;
  const cleanMethod = paymentMethod.toLowerCase().trim();
  if (settings.paymentMethodTtl[cleanMethod] !== undefined) {
    return Number(settings.paymentMethodTtl[cleanMethod]);
  }
  for (const [key, minutes] of Object.entries(settings.paymentMethodTtl)) {
    if (cleanMethod.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanMethod)) {
      return Number(minutes);
    }
  }
  return settings.defaultTtlMinutes;
}

export async function consumeStockReservation(
  txOrDb: any,
  orderId: string,
  performerName: string = 'Sistema'
) {
  const activeRes = await txOrDb
    .select()
    .from(stockReservations)
    .where(and(eq(stockReservations.orderId, orderId), eq(stockReservations.status, 'active')));

  if (activeRes.length === 0) return { consumed: 0 };

  const orderRows = await txOrDb.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = orderRows[0] || null;
  const docRef = order ? `${order.prefix || 'SZ-ORD'}-${order.documentNumber || order.id.substring(0, 8).toUpperCase()}` : orderId;

  for (const res of activeRes) {
    const partRows = await txOrDb.select().from(parts).where(eq(parts.id, res.partId)).for('update');
    if (partRows.length > 0) {
      const part = partRows[0];
      const prevReserved = part.stockReserved ?? 0;
      const newReserved = Math.max(0, prevReserved - res.quantity);

      // Decrement reserved stock
      await txOrDb.update(parts).set({
        stockReserved: newReserved
      }).where(eq(parts.id, res.partId));

      // Record Kardex movement and safely deduct physical stock once
      await recordInventoryMovement(txOrDb, {
        partId: res.partId,
        movementType: 'OUT_SALE',
        quantity: -res.quantity,
        unitPrice: part.price ?? 0,
        referenceType: 'order',
        referenceId: orderId,
        referenceDocument: docRef,
        notes: `Venta confirmada / pago aprobado en pedido ${docRef}`,
        userName: order?.customerName || performerName
      });
    }

    await txOrDb.update(stockReservations).set({
      status: 'consumed',
      updatedAt: new Date()
    }).where(eq(stockReservations.id, res.id));
  }

  await txOrDb.update(orders).set({
    reservationStatus: 'consumed'
  }).where(eq(orders.id, orderId));

  return { consumed: activeRes.length };
}

export async function releaseStockReservation(
  txOrDb: any,
  orderId: string,
  reason: string = 'Reserva cancelada / expirada',
  newOrderStatus?: string,
  performerName: string = 'Sistema'
) {
  const activeRes = await txOrDb
    .select()
    .from(stockReservations)
    .where(and(eq(stockReservations.orderId, orderId), eq(stockReservations.status, 'active')));

  const orderRows = await txOrDb.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = orderRows[0] || null;

  for (const res of activeRes) {
    const partRows = await txOrDb.select().from(parts).where(eq(parts.id, res.partId)).for('update');
    if (partRows.length > 0) {
      const part = partRows[0];
      const prevReserved = part.stockReserved ?? 0;
      const newReserved = Math.max(0, prevReserved - res.quantity);

      await txOrDb.update(parts).set({
        stockReserved: newReserved
      }).where(eq(parts.id, res.partId));
    }

    const isExpired = reason.toLowerCase().includes('expir') || reason.toLowerCase().includes('vencid');
    await txOrDb.update(stockReservations).set({
      status: isExpired ? 'expired' : 'released',
      updatedAt: new Date()
    }).where(eq(stockReservations.id, res.id));
  }

  const isExpired = reason.toLowerCase().includes('expir') || reason.toLowerCase().includes('vencid');
  const updateOrderData: any = {
    reservationStatus: isExpired ? 'expired' : 'released'
  };
  if (newOrderStatus) {
    updateOrderData.status = newOrderStatus;
  }

  if (order) {
    const timeStamp = new Date().toLocaleString('es-CO');
    const existingNotes = order.notes || '';
    const noteEntry = `[${timeStamp}] Liberación de reserva: ${reason} (por ${performerName}).`;
    updateOrderData.notes = existingNotes ? `${existingNotes}\n${noteEntry}` : noteEntry;
  }

  await txOrDb.update(orders).set(updateOrderData).where(eq(orders.id, orderId));

  return { released: activeRes.length };
}

export async function extendStockReservation(
  db: AppDb,
  params: {
    orderId: string;
    additionalMinutes: number;
    reason?: string;
    adminName?: string;
  }
) {
  const { orderId, additionalMinutes, reason = 'Solicitud de prórroga del cliente', adminName = 'Administrador' } = params;
  if (!orderId) throw new Error('ID del pedido es requerido');
  if (!additionalMinutes || additionalMinutes <= 0) throw new Error('El tiempo adicional en minutos debe ser mayor a 0');

  let result: any = null;

  await db.transaction(async (tx) => {
    const orderRows = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (orderRows.length === 0) throw new Error(`Pedido con ID ${orderId} no encontrado`);
    const order = orderRows[0];

    const reservations = await tx.select().from(stockReservations).where(eq(stockReservations.orderId, orderId));
    
    // Base time: maximum between current expiry and now
    const baseDate = order.reservationExpiresAt && new Date(order.reservationExpiresAt).getTime() > Date.now()
      ? new Date(order.reservationExpiresAt).getTime()
      : Date.now();
    
    const newExpiresAt = new Date(baseDate + additionalMinutes * 60 * 1000);

    const activeRes = reservations.filter(r => r.status === 'active');
    if (activeRes.length === 0 && (order.reservationStatus === 'expired' || order.reservationStatus === 'released' || order.status === 'Cancelado' || order.status === 'Expirado')) {
      // Re-reserve items if available
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const it of items) {
        if (!it.partId) continue;
        const partRows = await tx.select().from(parts).where(eq(parts.id, it.partId)).for('update');
        if (partRows.length > 0) {
          const part = partRows[0];
          const available = Math.max(0, (part.stock ?? 0) - (part.stockReserved ?? 0));
          if (available < it.quantity) {
            throw new Error(`No es posible reactivar la reserva: "${part.name}" solo tiene ${available} unidades disponibles.`);
          }
          await tx.update(parts).set({
            stockReserved: (part.stockReserved ?? 0) + it.quantity
          }).where(eq(parts.id, it.partId));

          await tx.insert(stockReservations).values({
            id: crypto.randomUUID(),
            orderId,
            partId: it.partId,
            quantity: it.quantity,
            status: 'active',
            expiresAt: newExpiresAt,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      await tx.update(orders).set({
        status: 'Pendiente de pago'
      }).where(eq(orders.id, orderId));
    } else {
      for (const res of activeRes) {
        await tx.update(stockReservations).set({
          expiresAt: newExpiresAt,
          status: 'active',
          updatedAt: new Date()
        }).where(eq(stockReservations.id, res.id));
      }
    }

    const timeStamp = new Date().toLocaleString('es-CO');
    const hours = (additionalMinutes / 60).toFixed(1);
    const noteEntry = `[${timeStamp}] Prórroga de reserva: +${additionalMinutes} min (~${hours}h) hasta ${newExpiresAt.toLocaleString('es-CO')}. Motivo: ${reason}. Autorizado por: ${adminName}.`;
    const existingNotes = order.notes || '';
    const updatedNotes = existingNotes ? `${existingNotes}\n${noteEntry}` : noteEntry;

    await tx.update(orders).set({
      reservationExpiresAt: newExpiresAt,
      reservationStatus: 'active',
      notes: updatedNotes
    }).where(eq(orders.id, orderId));

    result = {
      orderId,
      newExpiresAt: newExpiresAt.toISOString(),
      additionalMinutes,
      message: `Reserva extendida exitosamente hasta ${newExpiresAt.toLocaleString('es-CO')}`
    };
  });

  return result;
}

export async function expireOverdueReservations(db: AppDb) {
  const now = new Date();
  const settings = await getInventoryReservationSettings(db);
  if (!settings.enabled) return { expiredCount: 0, ordersProcessed: [] };

  const overdueReservations = await db
    .select()
    .from(stockReservations)
    .where(and(eq(stockReservations.status, 'active'), lte(stockReservations.expiresAt, now)));

  if (overdueReservations.length === 0) return { expiredCount: 0, ordersProcessed: [] };

  const orderIds = Array.from(new Set(overdueReservations.map(r => r.orderId)));
  const processed: string[] = [];

  const targetOrderStatus = settings.expiryAction === 'expire' ? 'Expirado' : 'Cancelado';

  for (const orderId of orderIds) {
    try {
      await db.transaction(async (tx) => {
        const orderRows = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
        if (orderRows.length === 0) return;
        const order = orderRows[0];

        const isPending = !order.status.toLowerCase().includes('pagad') &&
                          !order.status.toLowerCase().includes('enviad') &&
                          !order.status.toLowerCase().includes('entregad') &&
                          !order.status.toLowerCase().includes('complet');

        if (isPending) {
          await releaseStockReservation(
            tx,
            orderId,
            'Expiración automática por tiempo de retención (TTL) vencido',
            targetOrderStatus,
            'Sistema (Cron Automático)'
          );
          processed.push(orderId);
        } else {
          await consumeStockReservation(tx, orderId, 'Sistema');
        }
      });
    } catch (err) {
      console.error(`Error procesando expiración de pedido ${orderId}:`, err);
    }
  }

  return {
    expiredCount: processed.length,
    ordersProcessed: processed
  };
}

export async function getActiveStockReservations(db: AppDb): Promise<StockReservation[]> {
  try {
    await expireOverdueReservations(db);
  } catch {}

  const allReservations = await db
    .select({
      id: stockReservations.id,
      orderId: stockReservations.orderId,
      partId: stockReservations.partId,
      quantity: stockReservations.quantity,
      status: stockReservations.status,
      expiresAt: stockReservations.expiresAt,
      createdAt: stockReservations.createdAt,
      updatedAt: stockReservations.updatedAt,
      orderCustomer: orders.customerName,
      orderPaymentMethod: orders.paymentMethod,
      orderStatus: orders.status,
      orderPrefix: orders.prefix,
      orderDocNumber: orders.documentNumber,
      partName: parts.name,
      partSku: parts.sku,
      partImage: parts.image
    })
    .from(stockReservations)
    .leftJoin(orders, eq(stockReservations.orderId, orders.id))
    .leftJoin(parts, eq(stockReservations.partId, parts.id))
    .orderBy(desc(stockReservations.createdAt));

  const now = Date.now();

  return allReservations.map(r => {
    const expTime = r.expiresAt ? new Date(r.expiresAt).getTime() : now;
    const remainingSeconds = Math.max(0, Math.floor((expTime - now) / 1000));
    const isExpired = remainingSeconds <= 0;

    return {
      id: r.id,
      orderId: r.orderId,
      partId: r.partId,
      partName: r.partName || 'Repuesto',
      partSku: r.partSku || '',
      partImage: r.partImage || '',
      orderDocumentNumber: `${r.orderPrefix || 'SZ-ORD'}-${r.orderDocNumber || r.orderId.substring(0, 8).toUpperCase()}`,
      customerName: r.orderCustomer || 'Cliente',
      paymentMethod: r.orderPaymentMethod || 'transferencia',
      quantity: r.quantity,
      status: (isExpired && r.status === 'active' ? 'expired' : r.status) as any,
      expiresAt: r.expiresAt?.toISOString() || new Date().toISOString(),
      createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: r.updatedAt?.toISOString() || new Date().toISOString(),
      isExpired,
      remainingSeconds
    };
  });
}



