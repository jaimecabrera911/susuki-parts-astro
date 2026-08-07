# Especificación: Completar Pedido

> Documento generado a partir de la sesión de diseño (grill-me) — Agosto 2026  
> Estado: **Aprobado para implementación**

---

## Resumen

Reemplazar el flujo actual de **"Procesar Pedido Directo"** (modal de checkout inmediato) por un flujo de **"Completar Pedido"** que lleva al usuario a una página dedicada donde diligencia sus datos, confirma el método de pago por **transferencia bancaria** y recibe instrucciones para finalizar el pago.

---

## Problema actual

| Elemento | Comportamiento actual |
|----------|----------------------|
| Botón en carrito | `"Procesar Pedido Directo"` |
| Destino | `CheckoutModal` (modal superpuesto) |
| Campos | Nombre, dirección, teléfono (3 campos) |
| Método de pago | No existe |
| Estado del pedido | `"Despachado en Bodega Central"` (inmediato, irreal) |
| Post-confirmación | Modal de éxito → redirección a `/pedidos` |

**Archivos involucrados hoy:**

- `src/components/CartDrawer.tsx` — botón y CTA de checkout
- `src/components/CheckoutModal.tsx` — formulario y confirmación en modal
- `src/App.tsx` — estado `isCheckoutOpen`, handler `handleOrderComplete`

---

## Decisiones de diseño

### 1. Contenedor de checkout

| Decisión | Página dedicada |
|----------|-----------------|
| **Ruta** | `/completar-pedido` |
| **Tipo** | Tab/vista SPA (mismo patrón que `/pedidos`, `/cuenta`) |
| **Reemplaza** | Flujo del `CheckoutModal` |

### 2. Autenticación

| Decisión | Híbrido |
|----------|---------|
| Invitado | Puede completar pedido con formulario vacío |
| Logueado | Formulario pre-llenado desde `UserProfile` |
| Bloqueo | No se exige login para comprar |

**Campos pre-llenables desde perfil:**

```ts
UserProfile {
  fullName, email, phone, documentId,
  city, address, postalCode
}
```

### 3. Método de pago

| Decisión | Transferencia bancaria |
|----------|------------------------|
| UI | Único método visible/seleccionado (transferencia) |
| Flujo | Mostrar datos bancarios → usuario confirma pedido |
| Estado inicial del pedido | `"Pendiente de pago"` |
| Comprobante | No se sube en el MVP (validación manual posterior) |
| Canal alternativo | WhatsApp (ya existente en carrito) |

### 4. Post-confirmación

| Decisión | Pantalla de éxito en la misma ruta |
|----------|-------------------------------------|
| Contenido | Número de orden, total, datos bancarios, referencia de pago |
| Carrito | Se vacía al confirmar |
| CTA principal | `"Ver mis pedidos"` → `/pedidos` |
| CTA secundario | Imprimir / copiar referencia |

### 5. Formulario de datos

| Campo | Requerido | Notas |
|-------|-----------|-------|
| Nombre completo / Razón social | Sí | |
| Email | Sí | |
| Teléfono móvil | Sí | |
| Cédula / NIT | Sí | Facturación Colombia |
| Ciudad | Sí | |
| Dirección de despacho | Sí | |
| Código postal | Sí | |

### 6. Layout de la página

```
┌─────────────────────────────────────────────────────────┐
│  Navbar                                                 │
├──────────────────────────────┬──────────────────────────┤
│  COLUMNA IZQUIERDA           │  COLUMNA DERECHA         │
│                              │                          │
│  ┌─ Datos de contacto ─┐     │  ┌─ Resumen carrito ─┐   │
│  │ Formulario completo  │     │  │ Items + cantidades│   │
│  └─────────────────────┘     │  │ Subtotal / Total  │   │
│                              │  └───────────────────┘   │
│  ┌─ Método de pago ────┐     │                          │
│  │ Transferencia       │     │  ┌─ Datos bancarios ─┐   │
│  │ (único, seleccionado)│     │  │ Banco, cuenta,    │   │
│  └─────────────────────┘     │  │ titular, NIT      │   │
│                              │  └───────────────────┘   │
│  [ Confirmar Pedido ]        │                          │
└──────────────────────────────┴──────────────────────────┘
```

**Responsive (móvil):**

1. Resumen del carrito (colapsable)
2. Formulario de datos
3. Método de pago + datos bancarios
4. Botón confirmar (sticky bottom opcional)

### 7. Carrito vacío

| Decisión | Pantalla vacía en `/completar-pedido` |
|----------|---------------------------------------|
| Mensaje | `"Tu carrito está vacío"` |
| CTA | `"Ir al catálogo"` → `/catalogo` |
| Redirección automática | No |

### 8. Datos bancarios (demo)

| Decisión | Datos ficticios en archivo de configuración |
|----------|---------------------------------------------|
| Archivo propuesto | `src/data/bankDetails.ts` |
| Facilidad de cambio | Un solo lugar para reemplazar por datos reales |

**Valores demo sugeridos:**

```ts
export const BANK_DETAILS = {
  bankName: 'Bancolombia',
  accountType: 'Cuenta de Ahorros',
  accountNumber: '123-456789-01',
  accountHolder: 'Suzuki Parts Colombia S.A.S.',
  nit: '900.123.456-7',
  instructions: 'Usa el número de orden como referencia de pago.',
};
```

---

## Flujo de usuario

```mermaid
flowchart TD
    A[Carrito con items] --> B[Clic: Completar Pedido]
    B --> C{Carrrito vacío?}
    C -->|Sí| D[Pantalla vacía + CTA catálogo]
    C -->|No| E[/completar-pedido]
    E --> F{Usuario logueado?}
    F -->|Sí| G[Formulario pre-llenado]
    F -->|No| H[Formulario vacío]
    G --> I[Usuario revisa datos + transferencia]
    H --> I
    I --> J[Clic: Confirmar Pedido]
    J --> K[Pedido creado: Pendiente de pago]
    K --> L[Pantalla éxito con datos bancarios]
    L --> M[Ver mis pedidos / Imprimir]
```

---

## Cambios técnicos planificados

### Nuevos archivos

| Archivo | Propósito |
|---------|-----------|
| `src/components/CheckoutPage.tsx` | Página completa de checkout |
| `src/data/bankDetails.ts` | Datos bancarios configurables |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/CartDrawer.tsx` | Botón `"Completar Pedido"` + navegación |
| `src/App.tsx` | Tab `checkout`, ruta `/completar-pedido`, wiring |
| `src/types.ts` | Tipos `Order`, `PaymentMethod`, estados de pedido |
| `src/components/OrdersTable.tsx` | Badge/estilo para `"Pendiente de pago"` |
| `src/components/OrderDetailModal.tsx` | Mostrar método de pago y datos bancarios |

### Archivos a deprecar

| Archivo | Acción |
|---------|--------|
| `src/components/CheckoutModal.tsx` | Eliminar tras migrar lógica a `CheckoutPage` |

---

## Modelo de datos: Order (propuesto)

```ts
export type PaymentMethod = 'transferencia';

export type OrderStatus =
  | 'Pendiente de pago'
  | 'Pago confirmado'
  | 'Despachado en Bodega Central'
  | 'En tránsito'
  | 'Entregado'
  | 'Cancelado';

export interface Order {
  id: string;                    // SZ-ORD-XXXXXX
  date: string;
  customerName: string;
  email: string;
  phone: string;
  documentId: string;
  city: string;
  shippingAddress: string;
  postalCode: string;
  items: CartItem[];
  totalPrice: number;
  motorcycle: ActiveMotorcycle | null;
  guaranteeCode: string;         // SZ-CERT-XXXXXX
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentReference?: string;     // = order.id para transferencia
}
```

---

## Estados de pedido y colores UI

| Estado | Color sugerido | Icono |
|--------|----------------|-------|
| Pendiente de pago | Ámbar (`warning`) | `Clock` |
| Pago confirmado | Azul | `CheckCircle2` |
| Despachado en Bodega Central | Azul performance | `Package` |
| En tránsito | Azul | `Truck` |
| Entregado | Verde (`compatible`) | `CheckCircle2` |
| Cancelado | Rojo | `X` |

---

## Pantalla de éxito (post-confirmación)

**Contenido obligatorio:**

- Icono de confirmación
- Título: `"¡Pedido registrado exitosamente!"`
- Subtítulo: `"Realiza la transferencia para confirmar tu pedido"`
- Número de orden (copiable)
- Referencia de pago (= número de orden)
- Total a transferir
- Bloque con datos bancarios completos
- Vehículo asociado (si aplica)
- Código de garantía de compatibilidad
- Botones: `"Ver mis pedidos"`, `"Imprimir instrucciones"`

---

## Criterios de aceptación

- [ ] El botón del carrito dice **"Completar Pedido"** (no "Procesar Pedido Directo")
- [ ] Al hacer clic, cierra el drawer y navega a `/completar-pedido`
- [ ] Si el carrito está vacío, muestra pantalla vacía con CTA al catálogo
- [ ] Si el usuario está logueado, el formulario se pre-llena desde `UserProfile`
- [ ] El formulario incluye los 7 campos acordados
- [ ] Solo se muestra transferencia como método de pago
- [ ] Se muestran datos bancarios demo desde `bankDetails.ts`
- [ ] Al confirmar, el pedido se crea con status `"Pendiente de pago"`
- [ ] El carrito se vacía tras confirmar
- [ ] La pantalla de éxito muestra datos bancarios y referencia de pago
- [ ] El pedido aparece en `/pedidos` con el estado correcto
- [ ] `CheckoutModal` ya no se usa en el flujo principal
- [ ] La ruta `/completar-pedido` funciona con navegación SPA y botón atrás del browser

---

## Fuera de alcance (MVP)

- Subida de comprobante de transferencia
- Integración con pasarela de pagos (PSE, tarjeta)
- Validación automática de pago
- Envío de email de confirmación
- Múltiples métodos de pago
- Cálculo dinámico de costos de envío
- Persistencia de pedidos en backend/API

---

## Referencias en codebase

| Concepto | Ubicación actual |
|----------|------------------|
| Carrito | `src/components/CartDrawer.tsx` |
| Checkout modal (legacy) | `src/components/CheckoutModal.tsx` |
| Perfil de usuario | `src/components/UserProfilePage.tsx` |
| Tipo UserProfile | `src/types.ts` |
| Lista de pedidos | `src/components/OrdersTable.tsx` |
| Detalle de pedido | `src/components/OrderDetailModal.tsx` |
| Router SPA | `src/App.tsx` → `navigateToTab`, `handleLocationChange` |

---

## Historial de decisiones

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | ¿Página, modal o wizard? | **A** — Página `/completar-pedido` |
| 2 | ¿Requiere login? | **C** — Híbrido con pre-llenado |
| 3 | ¿Flujo de transferencia? | **A** — Datos bancarios + pendiente de pago |
| 4 | ¿Post-confirmación? | **A** — Éxito en misma ruta |
| 5 | ¿Campos del formulario? | **B** — Completo (7 campos) |
| 6 | ¿Layout? | **A** — Dos columnas |
| 7 | ¿Carrito vacío? | **B** — Pantalla vacía con CTA |
| 8 | ¿Datos bancarios? | **A** — Demo en config file |
