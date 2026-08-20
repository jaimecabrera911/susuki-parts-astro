import type { AppDb } from './client';
import {
  brands, models, modelYears,
  parts, partOemNumbers, partImages, partCompatibilities,
  schematics, schematicHotspots, schematicApplicableModels, schematicSections,
  orderStatuses, carriers, modelCategories,
  orders, orderItems, orderReturns, siteSettings,
  users, userFavorites,
  shippingMethods, shippingZones, shippingZoneStates, shippingMethodZoneRates,
  shippingZoneCities,
  countries, states, cities
} from './schema';
import { eq, and } from 'drizzle-orm';
import { DEFAULT_SHIPPING_ZONES, DEFAULT_SHIPPING_METHODS, DEFAULT_COLOMBIAN_CITIES, COLOMBIAN_DEPARTMENTS } from '../data/initialShippingAndCities';
import { STORE_DEFAULT_LOCATION, STORE_BOOTSTRAP, FOOTER_BOOTSTRAP, getBootstrapShowProductImages } from '../utils/config';
import { hashPassword } from '../utils/password';
import type { SiteSettings, PaymentSettings, WompiConfig } from '../types';

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

  return rows.map(p => ({
    ...p,
    sku: p.sku || `SKU-${p.id}`,
    oemNumbers: (oemByPart.get(p.id) || []).sort((a, b) => a.position - b.position).map(r => r.oemNumber),
    images: (imgByPart.get(p.id) || []).sort((a, b) => a.position - b.position).map(r => r.url),
    specs: p.specs || [],
    compatibility: (compatByPart.get(p.id) || []).map(r => ({
      modelId: r.modelId,
      yearStart: r.yearStart,
      yearEnd: r.yearEnd,
      version: r.version,
      note: r.note
    })),
    diagramHotspot: p.diagramHotspot ?? null,
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

  const data = {
    id,
    sku,
    name: body.name,
    category: body.category,
    price: Number(body.price),
    stock: Number(body.stock || 0),
    image: primaryImage,
    description: body.description || '',
    specs: body.specs || [],
    schematicId: body.schematicId ? ensureUuid(body.schematicId) : null,
    diagramHotspot: body.diagramHotspot || null,
    availability: body.availability || 'in_stock',
    taxable: body.taxable !== false,
    priceIncludesTax: body.priceIncludesTax === true
  };

  await db.transaction(async (tx) => {
    await tx.insert(parts).values(data).onConflictDoUpdate({ target: parts.id, set: data });

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
          itemNumber: Number(hs.itemNumber),
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
    documentNumber: normalizeDocumentNumber(body.documentNumber || (isValidUuid(rawId) ? String(Math.floor(100000 + Math.random() * 900000)) : rawId))
  };

  await db.transaction(async (tx) => {
    await tx.insert(orders).values(data).onConflictDoUpdate({ target: orders.id, set: data });

    await tx.delete(orderItems).where(eq(orderItems.orderId, id));
    const items = Array.isArray(body.items)
      ? body.items
      : (typeof body.items === 'string' ? parseJson(body.items, []) : []);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const part = item.part || (item.partId ? { id: item.partId, name: item.partName || '', oemNumbers: item.oemNumber ? [item.oemNumber] : [] } : {});
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(part.price ?? item.unitPrice ?? 0);
      const lineTotal = Number(item.lineTotal ?? quantity * unitPrice);

      await tx.insert(orderItems).values({
        id: crypto.randomUUID(),
        orderId: id,
        partId: part.id ?? null,
        part,
        quantity,
        unitPrice,
        lineTotal,
        motorcycle: item.motorcycle || null
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

  // If no password set yet for admin or newly created user, assign standard default
  if (!passwordHash && !body.id) {
    passwordHash = hashPassword(body.role === 'admin' ? 'Admin2026!' : 'Suzuki2026!');
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
        data.passwordHash = hashPassword(data.role === 'admin' ? 'Admin2026!' : 'Suzuki2026!');
      }
    }

    await tx.insert(users).values(data).onConflictDoUpdate({ target: users.id, set: data });

    await tx.delete(userFavorites).where(eq(userFavorites.userId, id));
    for (const partId of body.favoritePartIds || []) {
      if (partId && typeof partId === 'string') {
        await tx.insert(userFavorites).values({ id: crypto.randomUUID(), userId: id, partId, createdAt: new Date() }).onConflictDoNothing();
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
      await tx.update(orders).set({ status: 'Cancelado' }).where(eq(orders.id, data.orderId));
    }

    // Handle inventory restocking if switch is enabled and QC passed or status approved
    if (data.restockInventory && (data.qcStatus === 'passed' || data.status === 'Reembolsada' || data.status === 'Pieza recibida')) {
      const items = (data.itemDetailsJson && data.itemDetailsJson.length > 0) ? data.itemDetailsJson : (data.itemsJson || []);
      for (const item of items) {
        const partId = item.partId || item.id;
        const qty = Number(item.quantity || 1);
        if (partId) {
          const existingPart = await tx.select().from(parts).where(eq(parts.id, partId));
          if (existingPart.length > 0) {
            const currentStock = existingPart[0].stock ?? 0;
            await tx.update(parts).set({ stock: currentStock + qty }).where(eq(parts.id, partId));
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
    accounts: [
      {
        id: 'account-bancolombia-default',
        bankName: 'Bancolombia',
        accountType: 'Cuenta de Ahorros',
        accountNumber: '123-456789-01',
        accountHolder: 'Suzuki Parts Colombia S.A.S.',
        nit: '900.123.456-7',
        instructions: 'Usa el número de orden generado como referencia de pago al realizar la transferencia.',
        active: true,
        isDefault: true,
      }
    ]
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


