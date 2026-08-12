// Client API Service to communicate with backend endpoints in src/pages/api/
import { getAuthHeaders } from '../utils/auth';

export async function fetchBrands() {
  const res = await fetch('/api/brands');
  const json = await res.json();
  return json.data || [];
}

export async function fetchModels(brandId?: string) {
  const url = brandId ? `/api/models?brandId=${brandId}` : '/api/models';
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function fetchCategories() {
  const res = await fetch('/api/categories');
  const json = await res.json();
  return json.data || [];
}

export async function fetchModelCategories() {
  const res = await fetch('/api/model-categories');
  const json = await res.json();
  return json.data || [];
}

export async function fetchParts(params?: { category?: string; query?: string; oem?: string }) {
  let url = '/api/parts';
  if (params) {
    const qp = new URLSearchParams();
    if (params.category) qp.set('category', params.category);
    if (params.query) qp.set('q', params.query);
    if (params.oem) qp.set('oem', params.oem);
    if (qp.toString()) url += `?${qp.toString()}`;
  }
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function fetchSchematics(section?: string) {
  const url = section ? `/api/schematics?section=${section}` : '/api/schematics';
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function fetchOrders(query?: string, status?: string) {
  let url = '/api/orders';
  const qp = new URLSearchParams();
  if (query) qp.set('q', query);
  if (status) qp.set('status', status);
  if (qp.toString()) url += `?${qp.toString()}`;
  
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function fetchUsers(query?: string, role?: string) {
  let url = '/api/users';
  const qp = new URLSearchParams();
  if (query) qp.set('q', query);
  if (role) qp.set('role', role);
  if (qp.toString()) url += `?${qp.toString()}`;

  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

// MUTATION API HELPERS (POST, PUT, DELETE)

export async function saveBrandApi(brand: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/brands', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(brand)
  });
  return await res.json();
}

export async function deleteBrandApi(id: string) {
  const res = await fetch(`/api/brands?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function saveModelApi(model: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/models', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(model)
  });
  return await res.json();
}

export async function deleteModelApi(id: string) {
  const res = await fetch(`/api/models?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function savePartApi(part: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/parts', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(part)
  });
  return await res.json();
}

export async function deletePartApi(id: string) {
  const res = await fetch(`/api/parts?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function saveSchematicApi(schematic: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/schematics', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schematic)
  });
  return await res.json();
}

export async function deleteSchematicApi(id: string) {
  const res = await fetch(`/api/schematics?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function saveOrderApi(order: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/orders', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  return await res.json();
}

export async function deleteOrderApi(id: string) {
  const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function saveCategoryApi(category: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/categories', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  });
  return await res.json();
}

export async function deleteCategoryApi(id: string) {
  const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function saveUserApi(user: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/users', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  return await res.json();
}

export async function deleteUserApi(id: string) {
  const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function fetchGarages(userId?: string) {
  const url = userId ? `/api/garages?userId=${userId}` : '/api/garages';
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function saveGarageApi(vehicle: any) {
  const res = await fetch('/api/garages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicle)
  });
  return await res.json();
}

export async function deleteGarageApi(id: string) {
  const res = await fetch(`/api/garages?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function fetchShippingMethods() {
  const res = await fetch('/api/shipping-methods');
  const json = await res.json();
  return json.data || [];
}

export async function saveShippingMethodApi(shippingMethod: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/shipping-methods', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shippingMethod)
  });
  return await res.json();
}

export async function deleteShippingMethodApi(id: string) {
  const res = await fetch(`/api/shipping-methods?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function fetchCities() {
  const res = await fetch('/api/cities');
  const json = await res.json();
  return json.data || [];
}

export async function saveCityApi(city: any) {
  const res = await fetch('/api/cities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(city)
  });
  return await res.json();
}

export async function deleteCityApi(id: string) {
  const res = await fetch(`/api/cities?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function fetchShippingZones() {
  const res = await fetch('/api/shipping-zones');
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al cargar zonas de envío');
  return json.data || [];
}


export async function saveShippingZoneApi(shippingZone: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/shipping-zones', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shippingZone)
  });
  return await res.json();
}

export async function deleteShippingZoneApi(id: string) {
  const res = await fetch(`/api/shipping-zones?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

// --- DB-driven catalogs (order statuses & carriers) ---

interface CatalogStatus {
  id: string;
  name: string;
  color: string;
  short?: string;
  group?: string;
  is_default?: boolean;
  active?: boolean;
}

let statusesCache: CatalogStatus[] | null = null;
let carriersCache: { id: string; name: string; is_default?: boolean; active?: boolean }[] | null = null;

export async function fetchOrderStatuses(): Promise<CatalogStatus[]> {
  if (statusesCache) return statusesCache;
  const res = await fetch('/api/order-statuses');
  const json = await res.json();
  const rows = ((json.data || []) as CatalogStatus[]).filter(s => s.active);
  statusesCache = rows;
  return rows;
}

export async function fetchCarriers(): Promise<{ id: string; name: string; is_default?: boolean; active?: boolean }[]> {
  if (carriersCache) return carriersCache;
  const res = await fetch('/api/carriers');
  const json = await res.json();
  const rows = ((json.data || []) as { id: string; name: string; is_default?: boolean; active?: boolean }[]).filter(c => c.active);
  carriersCache = rows;
  return rows;
}

export async function fetchCarrierNames(): Promise<string[]> {
  const carriers = await fetchCarriers();
  return carriers.map(c => c.name);
}

export async function fetchDefaultStatusName(): Promise<string> {
  const statuses = await fetchOrderStatuses();
  return (
    statuses.find(s => s.is_default)?.name ||
    statuses[0]?.name ||
    ''
  );
}

export async function fetchDefaultCarrierName(): Promise<string> {
  const carriers = await fetchCarriers();
  return (
    carriers.find(c => c.is_default)?.name ||
    carriers[0]?.name ||
    ''
  );
}

// --- AUTHENTICATION & USER API HELPERS ---

export async function loginApi(email: string, password?: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return await res.json();
}

export async function verifyTokenApi(token: string) {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return await res.json();
}

// --- RETURNS & RMA API HELPERS ---

export async function fetchReturns(query?: string, status?: string, orderId?: string) {
  let url = '/api/returns';
  const qp = new URLSearchParams();
  if (query) qp.set('q', query);
  if (status) qp.set('status', status);
  if (orderId) qp.set('orderId', orderId);
  if (qp.toString()) url += `?${qp.toString()}`;

  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function saveReturnApi(returnItem: any, isEdit = false) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/returns', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(returnItem)
  });
  return await res.json();
}

export async function deleteReturnApi(id: string) {
  const res = await fetch(`/api/returns?id=${id}`, { method: 'DELETE' });
  return await res.json();
}

export async function sendOrderMessageApi(orderId: string, text: string, sender: 'customer' | 'admin' = 'customer', senderName?: string, isPrivate = false) {
  const res = await fetch('/api/orders/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      text,
      sender,
      senderName,
      isPrivate
    })
  });
  return await res.json();
}

export async function GET_SETTINGS() {
  const res = await fetch('/api/settings');
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Error cargando configuración');
  return json.data;
}

export async function POST_SETTINGS(settings: any) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Error guardando configuración');
  return json.data;
}

export async function UPLOAD_IMAGE(file: File, folder = 'store') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const token = localStorage.getItem('sz_jwt_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData
  });
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Error subiendo la imagen');
  return json.data as { url: string; key: string };
}




