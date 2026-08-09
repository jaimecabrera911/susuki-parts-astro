import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { brands, models, categories, subcategories, parts, schematics, orders, users } from '../../db/schema';
import { DEFAULT_BRANDS, INITIAL_ADMIN_MODELS, DEFAULT_CATEGORIES, INITIAL_ADMIN_PARTS, INITIAL_ADMIN_SCHEMATICS, DEFAULT_ORDERS, DEFAULT_USERS } from '../../data/adminStore';

export const POST: APIRoute = async () => {
  try {
    const db = getDb();

    // 1. Brands
    for (const b of DEFAULT_BRANDS) {
      await db.insert(brands).values({
        id: b.id,
        name: b.name,
        logo: b.logo || null,
        country: b.country || 'Japón',
        active: b.active !== undefined ? b.active : true,
        description: b.description || ''
      }).onConflictDoUpdate({
        target: brands.id,
        set: { name: b.name, active: b.active }
      });
    }

    // 2. Categories & Subcategories
    for (const c of DEFAULT_CATEGORIES) {
      await db.insert(categories).values({
        id: c.id,
        name: c.name,
        slug: c.slug,
        iconName: c.iconName || 'Wrench',
        description: c.description || '',
        active: c.active !== undefined ? c.active : true,
        order: c.order || 0
      }).onConflictDoUpdate({
        target: categories.id,
        set: { name: c.name }
      });

      if (c.subcategories) {
        for (const sub of c.subcategories) {
          await db.insert(subcategories).values({
            id: sub.id,
            categoryId: c.id,
            name: sub.name,
            slug: sub.slug,
            description: sub.description || '',
            active: sub.active !== undefined ? sub.active : true
          }).onConflictDoUpdate({
            target: subcategories.id,
            set: { name: sub.name }
          });
        }
      }
    }

    // 3. Models
    for (const m of INITIAL_ADMIN_MODELS) {
      await db.insert(models).values({
        id: m.id,
        brandId: m.brandId || 'suzuki',
        name: m.name,
        category: m.category,
        image: m.image,
        years: JSON.stringify(m.years || []),
        versions: JSON.stringify(m.versions || []),
        active: m.active !== undefined ? m.active : true,
        notes: m.notes || ''
      }).onConflictDoUpdate({
        target: models.id,
        set: { name: m.name }
      });
    }

    // 4. Parts
    for (const p of INITIAL_ADMIN_PARTS) {
      await db.insert(parts).values({
        id: p.id,
        oemNumbers: JSON.stringify(p.oemNumbers || []),
        name: p.name,
        category: p.category,
        price: Number(p.price),
        stock: Number(p.stock || 0),
        image: p.image,
        images: JSON.stringify(p.images || []),
        description: p.description || '',
        specs: JSON.stringify(p.specs || []),
        compatibility: JSON.stringify(p.compatibility || []),
        schematicId: p.schematicId || null,
        diagramHotspot: p.diagramHotspot ? JSON.stringify(p.diagramHotspot) : null,
        availability: p.availability || 'in_stock'
      }).onConflictDoUpdate({
        target: parts.id,
        set: { name: p.name, price: p.price }
      });
    }

    // 5. Schematics
    for (const s of INITIAL_ADMIN_SCHEMATICS) {
      await db.insert(schematics).values({
        id: s.id,
        title: s.title,
        category: s.category,
        section: s.section,
        applicableModelIds: JSON.stringify(s.applicableModelIds || []),
        diagramImage: s.diagramImage,
        description: s.description || '',
        hotspots: JSON.stringify(s.hotspots || [])
      }).onConflictDoUpdate({
        target: schematics.id,
        set: { title: s.title }
      });
    }

    // 6. Orders
    for (const o of DEFAULT_ORDERS) {
      let orderDate = new Date();
      if (o.date) {
        const parsed = new Date(o.date);
        if (!isNaN(parsed.getTime())) orderDate = parsed;
      }
      await db.insert(orders).values({
        id: o.id,
        date: orderDate,
        customerName: o.customerName,
        email: o.email,
        phone: o.phone,
        documentId: o.documentId,
        city: o.city,
        shippingAddress: o.shippingAddress,
        postalCode: o.postalCode || '',
        items: JSON.stringify(o.items || []),
        totalPrice: Number(o.totalPrice),
        motorcycle: o.motorcycle ? JSON.stringify(o.motorcycle) : null,
        guaranteeCode: o.guaranteeCode,
        paymentMethod: o.paymentMethod || 'transferencia',
        status: o.status || 'Pendiente de pago',
        paymentReference: o.paymentReference || 'PENDIENTE',
        trackingNumber: o.trackingNumber || null,
        shippingCarrier: o.shippingCarrier || null,
        notes: o.notes || ''
      }).onConflictDoUpdate({
        target: orders.id,
        set: { status: o.status }
      });
    }

    // 7. Users
    for (const u of DEFAULT_USERS) {
      let userCreatedAt = new Date();
      if (u.createdAt) {
        const parsed = new Date(u.createdAt);
        if (!isNaN(parsed.getTime())) userCreatedAt = parsed;
      }
      await db.insert(users).values({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        documentId: u.documentId,
        city: u.city,
        address: u.address,
        postalCode: u.postalCode || '',
        favoritePartIds: JSON.stringify(u.favoritePartIds || []),
        createdAt: userCreatedAt,
        avatarUrl: u.avatarUrl || null,
        role: u.role || 'customer',
        active: u.active !== undefined ? u.active : true,
        notes: u.notes || ''
      }).onConflictDoUpdate({
        target: users.id,
        set: { fullName: u.fullName }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Base de datos Neon DB sembrada con éxito.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
