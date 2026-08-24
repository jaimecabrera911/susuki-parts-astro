# Arquitectura Logística para E-commerce de Repuestos

## 1. Objetivo

Implementar una arquitectura logística que permita gestionar repuestos con diferentes modalidades de consecución:

- Stock inmediato.
- Bajo pedido nacional.
- Importación internacional.

El sistema debe diferenciar claramente entre:

1. **Estado de abastecimiento del repuesto.**
2. **Estado de recepción en bodega.**
3. **Estado logístico del pedido.**
4. **Estado de despacho al cliente.**

La estrategia inicial será **consolidar el pedido en la bodega antes del despacho**, manteniendo la posibilidad de implementar envíos parciales posteriormente.

---

## 2. Modalidades de disponibilidad

| Modalidad            | Origen                                    |    Tiempo estimado |
| -------------------- | ----------------------------------------- | -----------------: |
| `in_stock`           | Bodega local                              |             0 días |
| `national_on_demand` | Distribuidor / proveedor nacional         |   3–7 días hábiles |
| `international`      | Japón / EE. UU. / proveedor internacional | 15–30 días hábiles |

Cada producto debe mostrar claramente su modalidad y tiempo estimado de consecución.

Ejemplos:

- **Stock inmediato**
- **Bajo pedido nacional — 3 a 7 días**
- **Importación internacional — 15 a 30 días**

---

## 3. Principio fundamental de arquitectura

No se debe mezclar:

> **Dónde está el repuesto**

con:

> **Dónde está el pedido**

Un pedido puede contener múltiples repuestos con estados diferentes.

Ejemplo:

```text
ORDEN #1052

├── Filtro de aceite
│   └── Recibido en bodega ✅
│
├── Piñón
│   └── En tránsito internacional 🚢
│
└── Pastillas de freno
    └── Recibido en bodega ✅
```

En este caso, el pedido completo todavía no puede despacharse.

---

# 4. Estados del `order_item`

Se recomienda separar el proceso de abastecimiento del proceso de despacho.

## 4.1 Estado de abastecimiento

```text
pending
supplier_ordered
supplier_confirmed
international_transit
customs
received_at_warehouse
inspected
```

### Descripción

| Estado                  | Descripción                                  |
| ----------------------- | -------------------------------------------- |
| `pending`               | Aún no se ha iniciado la consecución         |
| `supplier_ordered`      | Se realizó el pedido al proveedor            |
| `supplier_confirmed`    | El proveedor confirmó disponibilidad/pedido  |
| `international_transit` | El repuesto está viajando internacionalmente |
| `customs`               | Se encuentra en proceso aduanero             |
| `received_at_warehouse` | Llegó físicamente a la bodega                |
| `inspected`             | Fue revisado y aprobado para despacho        |

No todos estos estados tienen que mostrarse al cliente.

---

# 5. Estado de despacho del `order_item`

El estado de abastecimiento no debe determinar directamente el despacho.

Ejemplo:

```text
procurement_status = inspected
shipping_status = pending
```

Esto significa:

> El repuesto ya está listo, pero todavía no ha sido enviado al cliente.

Se recomienda considerar:

```text
pending
ready
packed
shipped
delivered
```

---

# 6. Estados globales de `orders`

El pedido puede tener estados como:

```text
payment_confirmed
processing
procurement
import_transit
warehouse_received
ready_to_ship
shipped
delivered
cancelled
```

El estado global debe poder calcularse a partir de los estados de sus ítems y de las acciones administrativas.

---

# 7. Consolidación del pedido

La estrategia inicial será:

```text
Cliente compra
      ↓
Se reciben todos los ítems
      ↓
Inspección
      ↓
Consolidación
      ↓
Empaque
      ↓
Transportadora nacional
      ↓
Entrega
```

Cuando un pedido tenga productos mixtos:

```text
Stock inmediato
+
Importación internacional
+
Pedido nacional
```

el pedido esperará hasta que todos los productos estén disponibles.

Esto permite:

- Un solo paquete.
- Una sola guía.
- Menor costo de transporte.
- Menor manipulación.
- Experiencia más sencilla para el cliente.

---

# 8. Preparación para envíos parciales

Aunque inicialmente se utilizará consolidación, la base de datos debe quedar preparada para:

```text
shipping_strategy:
    consolidate
    partial
```

### `consolidate`

Todo el pedido se envía cuando todos los productos están disponibles.

### `partial`

Los productos disponibles pueden enviarse antes de que llegue el resto.

Esto permitirá implementar posteriormente:

> "Enviar ahora los productos disponibles y enviar el resto cuando llegue."

Sin tener que rediseñar completamente la arquitectura logística.

---

# 9. Promesa de entrega

El sistema debe calcular la fecha estimada considerando:

```text
Fecha estimada =
Fecha actual
+ tiempo máximo de consecución
+ tiempo de preparación
+ tiempo de transporte nacional
```

Para pedidos con múltiples ítems:

```text
max(lead_time de todos los ítems)
+
shipping_days
```

Ejemplo:

```text
Filtro:
0 días

Pastillas:
5 días

Piñón importado:
25 días

Tiempo nacional:
2 días

Estimación:
25 + 2 = 27 días
```

---

# 10. Congelar la promesa al crear la orden

Los tiempos del catálogo pueden cambiar.

Por esta razón, la orden debe conservar la promesa realizada al momento de la compra.

Ejemplo:

```text
order_item
├── lead_time_min_days: 15
├── lead_time_max_days: 30
└── estimated_delivery_date: YYYY-MM-DD
```

Si posteriormente el producto cambia de:

```text
15–30 días
```

a:

```text
20–40 días
```

la orden existente no debe modificar automáticamente la promesa original.

---

# 11. Checklist de recepción en bodega

Cada `order_item` debe poder ser gestionado individualmente desde el panel administrativo.

Ejemplo:

```text
ORDEN #1052

[✓] Filtro de aceite
    Recibido: 20/08/2026

[✓] Pastillas de freno
    Recibido: 21/08/2026

[ ] Piñón
    En tránsito internacional
```

El administrador debe poder:

- Marcar recepción.
- Registrar fecha de recepción.
- Registrar observaciones.
- Confirmar inspección.
- Detectar faltantes o daños.

---

# 12. Automatización de `ready_to_ship`

La orden puede pasar automáticamente a:

```text
ready_to_ship
```

cuando:

```text
TODOS los order_items
    ↓
received_at_warehouse
    ↓
inspected
```

Ejemplo:

```text
3/3 ítems recibidos
+
3/3 ítems inspeccionados
=
READY TO SHIP
```

En ese momento se habilita el proceso de despacho.

---

# 13. Despacho nacional

Cuando el pedido esté listo:

```text
ready_to_ship
      ↓
packed
      ↓
shipped
```

El administrador registra:

```text
carrier
tracking_number
shipped_at
tracking_url
```

Ejemplo:

```text
Transportadora: Inter Rapidísimo
Guía: XYZ123456
Fecha despacho: 23/08/2026
```

---

# 14. Notificaciones

El cliente debe recibir información durante todo el proceso.

### Pago confirmado

> Hemos recibido tu pedido y comenzamos el proceso de consecución.

### En consecución

> Estamos gestionando tus repuestos con nuestros proveedores.

### Importación

> Tus repuestos se encuentran en proceso de importación.

### Recibido en bodega

> Tus repuestos ya llegaron a nuestra bodega y estamos preparando tu pedido.

### Despachado

> ¡Tu pedido fue despachado! Guía: XYZ123456.

### Entregado

> Tu pedido ha sido entregado.

---

# 15. Modelo de datos recomendado

## `parts`

```text
origin_type
lead_time_min_days
lead_time_max_days
```

Valores:

```text
in_stock
national_on_demand
international
```

---

## `order_items`

```text
procurement_status
shipping_status

lead_time_min_days
lead_time_max_days
estimated_delivery_date

received_at
inspected_at

notes
```

Los tiempos deben conservar el valor utilizado cuando se creó la orden.

---

## `orders`

```text
order_status
shipping_strategy

estimated_delivery_date

carrier
tracking_number
tracking_url
shipped_at
delivered_at
```

---

# 16. Flujo completo

```mermaid
flowchart LR
    A[Pago confirmado]
    B[Procesar consecución]
    C[Proveedor]
    D[Tránsito / Importación]
    E[Recibido en bodega]
    F[Inspección]
    G[Pedido listo para despacho]
    H[Empaque]
    I[Transportadora nacional]
    J[Entregado]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
```

Para pedidos con múltiples productos, cada `order_item` recorre su propio proceso hasta llegar a:

```text
inspected
```

Después, el pedido completo puede avanzar.

---

# 17. Principios de implementación

La implementación debe seguir estos principios:

1. **Cada repuesto tiene su propio ciclo de abastecimiento.**
2. **El pedido tiene su propio ciclo logístico.**
3. **La recepción se controla por ítem.**
4. **La promesa de entrega se congela al momento de la compra.**
5. **La consolidación es la estrategia inicial.**
6. **La arquitectura debe permitir envíos parciales posteriormente.**
7. **El despacho solo se habilita cuando el pedido está completamente preparado.**
8. **El cliente debe recibir actualizaciones durante los períodos de espera.**
9. **Los estados internos pueden ser más detallados que los estados visibles al cliente.**
10. **Las transiciones críticas deben automatizarse siempre que sea posible.**

---

# 18. Recomendación final

La arquitectura recomendada es:

```text
PART
  ↓
PROCUREMENT
  ↓
ORDER_ITEM
  ↓
WAREHOUSE RECEIPT
  ↓
INSPECTION
  ↓
ORDER CONSOLIDATION
  ↓
SHIPMENT
  ↓
DELIVERY
```

El punto más importante es **no convertir `orders.order_status` en el responsable de toda la logística**.

El pedido debe funcionar como un contenedor de varios `order_items`, y cada ítem debe conservar su propio estado de abastecimiento y recepción.

De esta forma, el sistema puede crecer desde una operación sencilla de repuestos hacia una operación con múltiples proveedores, importaciones, consolidaciones y posteriormente envíos parciales sin tener que rehacer la arquitectura.
