import type { AppDb } from './client';
import {
  models, modelYears,
  parts, partOemNumbers, partCompatibilities,
  schematics, schematicHotspots, schematicApplicableModels,
  orders, orderItems,
  users, userFavorites
} from './schema';
import { eq } from 'drizzle-orm';

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

  return rows.map(p => ({
    ...p,
    oemNumbers: (oemByPart.get(p.id) || []).sort((a, b) => a.position - b.position).map(r => r.oemNumber),
    images: p.images || [],
    specs: p.specs || [],
    compatibility: (compatByPart.get(p.id) || []).map(r => ({
      modelId: r.modelId,
      yearStart: r.yearStart,
      yearEnd: r.yearEnd,
      version: r.version,
      note: r.note
    })),
    diagramHotspot: p.diagramHotspot ?? null
  }));
}

export async function upsertModel(db: AppDb, body: any) {
  const id = body.id || `model-${Date.now()}`;
  const data = {
    id,
    brandId: body.brandId || 'suzuki',
    name: body.name,
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
        await tx.insert(modelYears).values({ id: `${id}-yr-${year}`, modelId: id, year }).onConflictDoNothing();
      }
    }
  });

  return data;
}

export async function upsertPart(db: AppDb, body: any) {
  const id = body.id || `part-${Date.now()}`;
  const data = {
    id,
    name: body.name,
    category: body.category,
    price: Number(body.price),
    stock: Number(body.stock || 0),
    image: body.image,
    images: body.images || [],
    description: body.description || '',
    specs: body.specs || [],
    schematicId: body.schematicId || null,
    diagramHotspot: body.diagramHotspot || null,
    availability: body.availability || 'in_stock'
  };

  await db.transaction(async (tx) => {
    await tx.insert(parts).values(data).onConflictDoUpdate({ target: parts.id, set: data });

    await tx.delete(partOemNumbers).where(eq(partOemNumbers.partId, id));
    for (let i = 0; i < (body.oemNumbers || []).length; i++) {
      const oem = body.oemNumbers[i];
      if (oem && typeof oem === 'string') {
        await tx.insert(partOemNumbers).values({
          id: `${id}-oem-${i}`,
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
          id: `${id}-compat-${c.modelId}-${i}`,
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
  const id = body.id || `sch-${Date.now()}`;
  const data = {
    id,
    title: body.title,
    category: body.category,
    section: body.section,
    diagramImage: body.diagramImage,
    description: body.description || ''
  };

  await db.transaction(async (tx) => {
    await tx.insert(schematics).values(data).onConflictDoUpdate({ target: schematics.id, set: data });

    await tx.delete(schematicApplicableModels).where(eq(schematicApplicableModels.schematicId, id));
    for (const modelId of body.applicableModelIds || []) {
      if (modelId && typeof modelId === 'string') {
        await tx.insert(schematicApplicableModels).values({ id: `${id}-model-${modelId}`, schematicId: id, modelId }).onConflictDoNothing();
      }
    }

    await tx.delete(schematicHotspots).where(eq(schematicHotspots.schematicId, id));
    for (let i = 0; i < (body.hotspots || []).length; i++) {
      const hs = body.hotspots[i];
      if (hs && hs.itemNumber !== undefined) {
        await tx.insert(schematicHotspots).values({
          id: `${id}-hs-${hs.itemNumber}-${i}`,
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
  const id = body.id || `SZ-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  let date = new Date();
  if (body.date) {
    const parsed = new Date(body.date);
    if (!isNaN(parsed.getTime())) date = parsed;
  }

  const data = {
    id,
    date,
    customerName: body.customerName || 'Cliente Suzuki',
    email: body.email || 'cliente@suzukiparts.com.co',
    phone: body.phone || '',
    documentId: body.documentId || '',
    city: body.city || '',
    shippingAddress: body.shippingAddress || '',
    postalCode: body.postalCode || '',
    totalPrice: Number(body.totalPrice || 0),
    motorcycle: body.motorcycle || null,
    guaranteeCode: body.guaranteeCode || `SZ-GAR-${Math.floor(1000 + Math.random() * 9000)}-PENDING`,
    paymentMethod: body.paymentMethod || 'transferencia',
    status: body.status || 'Pendiente de pago',
    paymentReference: body.paymentReference || id,
    trackingNumber: body.trackingNumber || null,
    shippingCarrier: body.shippingCarrier || null,
    notes: body.notes || ''
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
        id: `${id}-item-${i}`,
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
  const id = body.id || `usr-${Date.now()}`;
  let createdAt = new Date();
  if (body.createdAt) {
    const parsed = new Date(body.createdAt);
    if (!isNaN(parsed.getTime())) createdAt = parsed;
  }

  const data = {
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

  await db.transaction(async (tx) => {
    await tx.insert(users).values(data).onConflictDoUpdate({ target: users.id, set: data });

    await tx.delete(userFavorites).where(eq(userFavorites.userId, id));
    for (const partId of body.favoritePartIds || []) {
      if (partId && typeof partId === 'string') {
        await tx.insert(userFavorites).values({ id: `${id}-fav-${partId}`, userId: id, partId, createdAt: new Date() }).onConflictDoNothing();
      }
    }
  });

  return data;
}
