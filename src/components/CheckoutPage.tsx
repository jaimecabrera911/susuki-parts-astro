import React, { useState, useEffect } from "react";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import {
  ShoppingBag,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  ArrowRight,
  Clock,
  CheckCircle2,
  Printer,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Wrench,
  Tag,
  Percent,
} from "lucide-react";
import type {
  CartItem,
  ActiveMotorcycle,
  UserProfile,
  Order,
  ShippingMethod,
  ShippingZone,
  CityRecord,
  TaxConfig,
  Coupon,
} from "../types";
import { getPrimaryOem } from "../types";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDocumentNumber } from "../utils/formatDocumentNumber";
import { BANK_DETAILS } from "../data/bankDetails";
import {
  shouldShowProductImages,
  getDefaultLocation,
} from "../utils/config";
import { useSiteSettings } from "./SiteSettingsProvider";
import { ProductImageEmptyState } from "./ProductImageEmptyState";
import { LocationSelector } from "./LocationSelector";
import {
  saveOrderApi,
  fetchShippingMethods,
  fetchCities,
  fetchShippingZones,
  fetchDefaultStatusName,
  fetchDefaultCarrierName,
} from "../services/api";

import { calculateCartTotals } from "../utils/taxCalculator";

export function getShippingMethodCost(
  method: ShippingMethod | null | undefined,
  department: string,
  rawSubtotal: number,
  zones: ShippingZone[],
): number {
  if (!method) return 0;
  if (method.carrier === "Retiro en tienda") return 0;
  if (
    method.freeShippingThreshold &&
    rawSubtotal >= method.freeShippingThreshold
  )
    return 0;

  const deptClean = department.trim().toLowerCase();
  if (deptClean && zones && zones.length > 0) {
    // Find matching zone for department
    const matchedZone = zones.find(
      (z) =>
        z.active &&
        z.departments.some((d) => d.trim().toLowerCase() === deptClean),
    );

    if (matchedZone && method.zoneRates && method.zoneRates.length > 0) {
      const zRate = method.zoneRates.find((zr) => zr.zoneId === matchedZone.id);
      if (zRate !== undefined && zRate.price !== undefined) {
        return zRate.price;
      }
    }

    // Catch-all zone (empty departments array)
    if (!matchedZone && method.zoneRates && method.zoneRates.length > 0) {
      const catchAllZone = zones.find(
        (z) => z.active && z.departments.length === 0,
      );
      if (catchAllZone) {
        const zRate = method.zoneRates.find(
          (zr) => zr.zoneId === catchAllZone.id,
        );
        if (zRate !== undefined && zRate.price !== undefined) {
          return zRate.price;
        }
      }
    }
  }

  return method.price;
}

interface CheckoutPageProps {
  cartItems: CartItem[];
  activeMotorcycle: ActiveMotorcycle | null;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  onOrderComplete: (order: Order) => void;
  onClearCart: () => void;
  onNavigateToCatalog: () => void;
  onNavigateToOrders: () => void;
}

// Carrier badge styles
const CARRIER_BADGES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Servientrega: {
    bg: "bg-emerald-50 text-emerald-700",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  "Inter Rapidísimo": {
    bg: "bg-amber-50 text-amber-800",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  Coordinadora: {
    bg: "bg-blue-50 text-blue-700",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Envía: {
    bg: "bg-purple-50 text-purple-700",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  TCC: {
    bg: "bg-rose-50 text-rose-700",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  "Retiro en tienda": {
    bg: "bg-sky-50 text-sky-700",
    text: "text-sky-700",
    border: "border-sky-200",
  },
};

// Relative delivery date calculator
function getEstimatedDeliveryInfo(
  estimatedDays: number,
  dispatchDays: string[] = ["1", "2", "3", "4", "5"],
) {
  if (estimatedDays === 0) {
    return {
      arrivalText: "¡Disponible HOY mismo para retiro!",
      dispatchNotice: "Retiro presencial inmediato en sede central",
    };
  }

  const today = new Date();
  let startDate = new Date(today);

  // Advance to next allowed dispatch day if today isn't one
  let daysAdvanced = 0;
  while (daysAdvanced < 7) {
    const currentDayNum = String(
      startDate.getDay() === 0 ? 7 : startDate.getDay(),
    );
    if (dispatchDays.includes(currentDayNum)) {
      break;
    }
    startDate.setDate(startDate.getDate() + 1);
    daysAdvanced++;
  }

  const isTodayDispatch = daysAdvanced === 0;

  const minArrival = new Date(startDate);
  minArrival.setDate(minArrival.getDate() + estimatedDays);

  const maxArrival = new Date(startDate);
  maxArrival.setDate(maxArrival.getDate() + estimatedDays + 1);

  const formatShort = (d: Date) =>
    d.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const dispatchNotice = isTodayDispatch
    ? "Despacho estimado: Hoy mismo"
    : `Despacho estimado: Próximo ${startDate.toLocaleDateString("es-CO", { weekday: "long", day: "numeric" })}`;

  const arrivalText = `Llega entre el ${formatShort(minArrival)} y el ${formatShort(maxArrival)}`;

  return { arrivalText, dispatchNotice };
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  activeMotorcycle,
  userProfile,
  isLoggedIn,
  onOrderComplete,
  onClearCart,
  onNavigateToCatalog,
  onNavigateToOrders,
}) => {
  // Effective motorcycle details
  const effectiveBike: ActiveMotorcycle | null = activeMotorcycle;

  // Effective items directly from cartItems state
  const effectiveCartItems: CartItem[] = cartItems;

  // Form fields
  const [formData, setFormData] = useState({
    fullName: isLoggedIn && userProfile?.fullName ? userProfile.fullName : "",
    email: isLoggedIn && userProfile?.email ? userProfile.email : "",
    phone: isLoggedIn && userProfile?.phone ? userProfile.phone : "",
    documentId:
      isLoggedIn && userProfile?.documentId ? userProfile.documentId : "",
    country: getDefaultLocation().country,
    department:
      isLoggedIn && userProfile?.department ? userProfile.department : "",
    city: isLoggedIn && userProfile?.city ? userProfile.city : "",
    address: isLoggedIn && userProfile?.address ? userProfile.address : "",
    postalCode:
      isLoggedIn && userProfile?.postalCode ? userProfile.postalCode : "",
  });

  // Dynamic DB State — loaded from API, no hardcoded defaults
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const [citiesList, setCitiesList] = useState<CityRecord[]>([]);

  // Pre-fill form if user logs in or profile updates
  useEffect(() => {
    if (userProfile && isLoggedIn) {
      setFormData((prev) => ({
        ...prev,
        fullName: userProfile.fullName || prev.fullName,
        email: userProfile.email || prev.email,
        phone: userProfile.phone || prev.phone,
        documentId: userProfile.documentId || prev.documentId,
        department: userProfile.department || prev.department,
        city: userProfile.city || prev.city,
        address: userProfile.address || prev.address,
        postalCode: userProfile.postalCode || prev.postalCode,
      }));
    }
  }, [userProfile, isLoggedIn]);

  // Load Shipping Methods, Zones & Cities from DB via API
  useEffect(() => {
    fetchShippingMethods()
      .then((data) => {
        if (data && data.length > 0) {
          const active = data.filter((m: ShippingMethod) => m.active);
          const list = active.length > 0 ? active : data;
          setShippingMethods(list);
          if (list.length > 0) {
            setSelectedShippingId(list[0].id);
          }
        }
      })
      .catch((err) => console.error("Error cargando envíos en checkout:", err));

    fetchShippingZones()
      .then((data) => {
        setShippingZones(data.filter((z: ShippingZone) => z.active));
      })
      .catch((err) =>
        console.error("Error cargando zonas de envío en checkout:", err),
      );

    fetchCities()
      .then((data) => {
        if (data && data.length > 0) {
          setCitiesList(data.filter((c: CityRecord) => c.active));
        }
      })
      .catch((err) =>
        console.error("Error cargando ciudades en checkout:", err),
      );
  }, []);

  // Tax Config & Coupons State
  const { settings: siteSettings } = useSiteSettings();
  const taxConfig: TaxConfig = {
    taxName: siteSettings.taxName,
    taxRate: typeof siteSettings.taxRate === "number" ? siteSettings.taxRate : 0,
    active: siteSettings.taxActive === true,
  };

  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/coupons")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.data))
          setAvailableCoupons(res.data);
      })
      .catch(() => {});
  }, []);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [defaultCarrier, setDefaultCarrier] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetchDefaultCarrierName()
      .then((name) => {
        if (!cancelled) setDefaultCarrier(name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Subtotal, Shipping & Financial Breakdown Calculations
  const rawSubtotal = effectiveCartItems.reduce(
    (acc, item) => acc + item.part.price * item.quantity,
    0,
  );
  const selectedShipping =
    shippingMethods.find((m) => m.id === selectedShippingId) ||
    shippingMethods[0];
  const actualShippingCost = getShippingMethodCost(
    selectedShipping,
    formData.department,
    rawSubtotal,
    shippingZones,
  );

  const totals = calculateCartTotals(
    effectiveCartItems,
    taxConfig.taxRate,
    taxConfig.active,
    appliedCoupon,
    actualShippingCost,
  );

  const subtotalAmount = totals.subtotal;
  const discountAmount = totals.discount;
  const activeTaxRate = taxConfig.active ? taxConfig.taxRate : 0;
  const taxAmount = totals.taxAmount;
  const totalAmount = totals.totalPrice;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const codeClean = couponInput.trim().toUpperCase();
    if (!codeClean) return;

    const coupon = availableCoupons.find(
      (c) => c.code.toUpperCase() === codeClean && c.active,
    );
    if (!coupon) {
      setCouponMessage({
        type: "error",
        text: "El código de cupón no es válido o ha expirado.",
      });
      return;
    }

    if (coupon.minPurchase && subtotalAmount < coupon.minPurchase) {
      setCouponMessage({
        type: "error",
        text: `Este cupón requiere una compra mínima de ${formatCurrency(coupon.minPurchase)}.`,
      });
      return;
    }

    setAppliedCoupon(coupon);
    setCouponMessage({
      type: "success",
      text: `¡Cupón ${coupon.code} aplicado con éxito! (${coupon.type === "percentage" ? `${coupon.value}% OFF` : formatCurrency(coupon.value)})`,
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.documentId ||
      !formData.city ||
      !formData.address
    ) {
      setErrorMessage(
        "Por favor completa todos los campos requeridos para el despacho.",
      );
      return;
    }

    setIsSubmitting(true);

    const orderId = "SZ-ORD-" + Math.floor(100000 + Math.random() * 900000);
    const guaranteeCode =
      "SZ-CERT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderDate = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      date: orderDate,
      customerName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      documentId: formData.documentId,
      country: formData.country,
      department: formData.department,
      city: formData.city,
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.department}`,
      postalCode: formData.postalCode,
      items: [...effectiveCartItems],
      subtotal: subtotalAmount,
      discount: discountAmount,
      discountCode: appliedCoupon ? appliedCoupon.code : undefined,
      taxRate: activeTaxRate,
      taxAmount: taxAmount,
      totalPrice: totalAmount,
      shippingCost: actualShippingCost,
      shippingMethodName: selectedShipping?.name || "No especificado",
      shippingCarrier:
        selectedShipping?.carrier || (await fetchDefaultCarrierName()),
      motorcycle: effectiveBike,
      guaranteeCode,
      paymentMethod: "transferencia",
      status: (await fetchDefaultStatusName()) || "Pendiente de pago",
      paymentReference: orderId,
    };

    let finalOrder = newOrder;

    try {
      // 1. Save to Neon DB via API
      const res = await saveOrderApi(newOrder);
      if (res?.data) {
        finalOrder = { ...newOrder, ...res.data };
      }

      // 2. Save to localStorage as immediate client backup
      const stored = JSON.parse(localStorage.getItem("sz_user_orders") || "[]");
      localStorage.setItem(
        "sz_user_orders",
        JSON.stringify([finalOrder, ...stored.filter((o: any) => o.id !== finalOrder.id)]),
      );
    } catch (err) {
      console.error("Error guardando pedido en BD:", err);
    }

    setCompletedOrder(finalOrder);
    onOrderComplete(finalOrder);
    onClearCart();
    setIsSubmitting(false);
  };

  // 1. EMPTY CART STATE
  if (!completedOrder && cartItems.length === 0) {
    return (
      <div id="checkout-page" className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E60012] flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display">
            Tu carrito está vacío
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-sans">
            No tienes repuestos agregados para completar tu pedido. Explora
            nuestro catálogo de repuestos genuinos Suzuki con garantía de ajuste
            por modelo.
          </p>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer"
          >
            <span>Explorar Catálogo Suzuki OEM</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. SUCCESS POST-CONFIRMATION VOUCHER VIEW
  if (completedOrder) {
    return (
      <div id="checkout-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Header Status Banner */}
          <div className="bg-slate-50 border-b border-slate-200 text-slate-900 p-6 sm:p-8 relative overflow-hidden">
            <div className="relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700" />
                      {completedOrder.status}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1 font-display text-slate-900">
                    ¡Pedido Registrado Exitosamente!
                  </h1>
                  <p className="text-xs text-slate-600 font-sans">
                    Realiza la transferencia bancaria para confirmar la
                    preparación de tu despacho.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 text-center min-w-[160px] shadow-2xs">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block tracking-wider">
                  Nº DE ORDEN
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="font-mono font-black text-slate-900 text-lg">
                    {formatDocumentNumber(completedOrder.id, completedOrder.prefix, completedOrder.documentNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(formatDocumentNumber(completedOrder.id, completedOrder.prefix, completedOrder.documentNumber), "orderId")}
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copiar Número de Orden"
                  >
                    {copiedField === "orderId" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Order Status Stepper Timeline */}
            <OrderStatusTimeline order={completedOrder} />

            {/* Customer & Shipping Data Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider block mb-1">
                  DESTINATARIO / CLIENTE
                </span>
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5 font-display text-sm">
                  <User className="w-4 h-4 text-slate-500" />
                  {completedOrder.customerName}
                </div>
                <div className="text-slate-600 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {completedOrder.phone} ({completedOrder.email})
                </div>
                <div className="text-slate-500 font-mono mt-0.5">
                  Cédula / NIT: <strong>{completedOrder.documentId}</strong>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider block mb-1">
                  DIRECCIÓN & CIUDAD DE DESPACHO
                </span>
                <div className="font-semibold text-slate-800 flex items-start gap-1.5 text-xs">
                  <MapPin className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
                  <span>
                    {completedOrder.shippingAddress} (
                    {completedOrder.postalCode})
                  </span>
                </div>
                <div className="text-slate-500 mt-1.5 font-mono text-[11px]">
                  Método de Envío:{" "}
                  <strong className="text-slate-800">
                    {completedOrder.shippingMethodName || "Envío a domicilio"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Detailed Items List (Repuestos OEM Incluidos) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-900 tracking-wider block font-display">
                  REPUESTOS INCLUIDOS EN LA ORDEN ({completedOrder.items.length}
                  ):
                </span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {completedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
                  >
                    {/* Top Row: Image + Name + OEM Monospace Badge */}
                    <div className="flex items-start gap-3">
                      {shouldShowProductImages() ? (
                        <img
                          src={item.part.image}
                          alt={item.part.name}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0 shadow-xs"
                        />
                      ) : (
                        <ProductImageEmptyState className="w-14 h-14 shrink-0 rounded-xl" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                            {item.part.category}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-xs sm:text-sm mt-1 leading-snug font-display">
                          {item.part.name}
                        </h4>
                      </div>

                      {/* Compatibility Status Badge */}
                      <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold shrink-0 ml-2">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {[
                              item.motorcycle?.brand ||
                                completedOrder.motorcycle?.brand,
                              item.motorcycle?.modelName ||
                                completedOrder.motorcycle?.modelName,
                              (item.motorcycle?.year ||
                                completedOrder.motorcycle?.year) &&
                                `(${
                                  item.motorcycle?.year ||
                                  completedOrder.motorcycle?.year
                                })`,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Moto no especificada"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Item Line Subtotal */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-600 font-medium">
                        Cantidad:{" "}
                        <strong className="text-slate-900 font-mono font-bold">
                          {item.quantity}
                        </strong>{" "}
                        ×{" "}
                        <span className="font-mono">
                          {formatCurrency(item.part.price)}
                        </span>
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(item.part.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals Voucher Summary */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal Repuestos OEM:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(
                      completedOrder.subtotal ?? completedOrder.totalPrice,
                    )}
                  </span>
                </div>
                {completedOrder.discount && completedOrder.discount > 0 ? (
                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <span>
                      Descuento Promocional (
                      {completedOrder.discountCode || "Cupón"}):
                    </span>
                    <span>- {formatCurrency(completedOrder.discount)}</span>
                  </div>
                ) : null}
                {completedOrder.taxAmount && completedOrder.taxAmount > 0 ? (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Impuesto ({completedOrder.taxRate}%):</span>
                    <span className="font-bold text-slate-900">
                      + {formatCurrency(completedOrder.taxAmount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Costo de Despacho Nacional:</span>
                  <span className="font-bold text-slate-900">
                    {completedOrder.shippingCost === 0
                      ? "¡Flete GRATIS!"
                      : formatCurrency(completedOrder.shippingCost || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-300 font-black text-sm text-slate-900 font-display">
                  <span>TOTAL LIQUIDADO DE LA ORDEN:</span>
                  <span className="text-[#E60012] font-mono text-base">
                    {formatCurrency(completedOrder.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Details Card (Light Theme) */}
            <div className="bg-slate-50 text-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-black text-sm shrink-0">
                    <Building2 className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-black font-display text-slate-900">
                      Datos Bancarios para Transferencia
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {BANK_DETAILS.instructions}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block font-mono">
                    TOTAL A TRANSFERIR
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-700">
                    {formatCurrency(completedOrder.totalPrice)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block font-mono">
                    TITULAR DE LA CUENTA
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs block mt-0.5">
                    {BANK_DETAILS.accountHolder}
                  </span>
                  <span className="text-slate-600 block text-[11px] font-mono mt-0.5">
                    NIT: {BANK_DETAILS.nit}
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block font-mono">
                    BANCO & TIPO DE CUENTA
                  </span>
                  <span className="font-black text-slate-900 text-xs block mt-0.5">
                    {BANK_DETAILS.bankName}
                  </span>
                  <span className="text-slate-600 block text-[11px] mt-0.5">
                    {BANK_DETAILS.accountType}
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block font-mono">
                    NÚMERO DE CUENTA
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono font-black text-amber-700 text-sm sm:text-base">
                      {BANK_DETAILS.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(BANK_DETAILS.accountNumber, "accountNumber")
                      }
                      className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer transition-colors"
                      title="Copiar Número de Cuenta"
                    >
                      {copiedField === "accountNumber" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onNavigateToOrders}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ver Mis Pedidos Guardados</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN CHECKOUT FORM & DETAIL PROCESS
  return (
    <div id="checkout-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E60012] uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-[#E60012]" />
          <span>CHECKOUT SEGURO</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
          Finalizar Compra & Despacho
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Completa los datos de envío para calcular dinámicamente tu pedido.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Customer & Address Form + Shipping Methods Selector (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {/* Form Section 1: Personal & Billing Info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E60012] flex items-center justify-center font-bold shrink-0">
                  <User className="w-5 h-5 text-[#E60012]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    1. Datos del Cliente & Facturación
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Información requerida para la factura legal
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-bold uppercase text-slate-700 mb-1"
                  >
                    Nombre Completo / Razón Social{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Ej. Taller Mecánico Motos o Juan Pérez"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold uppercase text-slate-700 mb-1"
                  >
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="cliente@ejemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-bold uppercase text-slate-700 mb-1"
                  >
                    Teléfono Móvil (WhatsApp){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+57 310 982 7311"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="documentId"
                    className="block text-xs font-bold uppercase text-slate-700 mb-1"
                  >
                    Cédula / NIT (Facturación){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="documentId"
                      name="documentId"
                      type="text"
                      required
                      value={formData.documentId}
                      onChange={handleInputChange}
                      placeholder="Ej. 1.098.472.910"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section 2: Destination Address & Location Selector */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                  <MapPin className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    2. Ubicación & Dirección de Destino
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Selección en cascada de Departamento / Estado y Ciudad de
                    despacho
                  </p>
                </div>
              </div>

              {/* Selector en Cascada: País (Bloqueado), Departamento/Estado, Ciudad */}
              <LocationSelector
                country={formData.country}
                department={formData.department}
                city={formData.city}
                citiesList={citiesList}
                onChange={({ country, department, city }) => {
                  setFormData((prev) => ({
                    ...prev,
                    country,
                    department,
                    city,
                  }));
                }}
                className="mb-4"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dirección Completa */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-xs font-bold uppercase text-slate-700 mb-1"
                  >
                    Dirección Completa de Despacho / Taller{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Ej. Calle 80 #68-12, Barrio / Taller Mecánico"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                    />
                  </div>
                </div>

                {/* Código Postal */}
                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-xs font-bold uppercase text-slate-700 mb-1"
                  >
                    Código Postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="Ej. 110111"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012]"
                  />
                </div>
              </div>
            </div>

            {/* Form Section 3: Dynamic Shipping Methods Selector */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold shrink-0">
                  <Truck className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    3. Selecciona la Opción de Envío
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Transportadoras con número de guía rastreable en tiempo real
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {shippingMethods.map((method) => {
                  const isSelected = selectedShippingId === method.id;
                  const badge = CARRIER_BADGES[method.carrier] || {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    border: "border-slate-200",
                  };

                  const effectivePrice = getShippingMethodCost(
                    method,
                    formData.department,
                    rawSubtotal,
                    shippingZones,
                  );

                  const deliveryInfo = getEstimatedDeliveryInfo(
                    method.estimatedDays,
                    method.dispatchDays,
                  );

                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedShippingId(method.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-sky-500 bg-sky-50/40 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="shippingOption"
                            id={method.id}
                            checked={isSelected}
                            onChange={() => setSelectedShippingId(method.id)}
                            className="mt-1 w-4 h-4 text-sky-600 focus:ring-sky-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                              >
                                {method.carrier}
                              </span>
                              <span className="font-bold text-slate-900 text-sm font-display">
                                {method.name}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 mt-1">
                              {method.description}
                            </p>

                            {/* Human Arrival Date Notice */}
                            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-sky-700">
                              <Calendar className="w-3.5 h-3.5 text-sky-600" />
                              <span>{deliveryInfo.arrivalText}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {deliveryInfo.dispatchNotice}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {effectivePrice === 0 ? (
                            <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2.5 py-1 rounded-full border border-emerald-200 uppercase font-mono">
                              ¡GRATIS!
                            </span>
                          ) : (
                            <span className="font-mono font-black text-slate-900 text-base">
                              {formatCurrency(effectivePrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Section 4: Payment Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    4. Método de Pago
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Transferencia segura Bancolombia con código de reserva
                  </p>
                </div>
              </div>

              {/* Transferencia Option Card */}
              <div className="bg-amber-50/60 border-2 border-amber-400 p-5 rounded-2xl flex items-start gap-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  id="transferencia"
                  checked
                  readOnly
                  className="mt-1 w-4 h-4 text-[#E60012] focus:ring-[#E60012]"
                />
                <label
                  htmlFor="transferencia"
                  className="cursor-pointer w-full"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 text-sm font-display">
                      Transferencia Bancaria (Bancolombia)
                    </span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                      Recomendado
                    </span>
                  </div>
                  <div className="mt-2.5 p-3 bg-white/80 rounded-xl border border-amber-300/80 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500 font-bold">Titular:</span>
                      <strong className="text-slate-900 font-extrabold">
                        {BANK_DETAILS.accountHolder}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500 font-bold">NIT:</span>
                      <strong className="text-slate-900">
                        {BANK_DETAILS.nit}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500 font-bold">
                        Nº Cuenta (Ahorros):
                      </span>
                      <strong className="text-amber-800 font-black">
                        {BANK_DETAILS.accountNumber}
                      </strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    Al confirmar el pedido recibirás el número de orden y la
                    cuenta Bancolombia habilitada. Tu pedido quedará en{" "}
                    <strong>"Pendiente de pago"</strong> hasta verificar la
                    transferencia.
                  </p>
                </label>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#E60012] hover:bg-red-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-red-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Generando Pedido OEM...</span>
              ) : (
                <>
                  <span>Confirmar Pedido & Ver Datos de Pago</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Order Breakdown Summary (100% DESIGN.md Compliant) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">
                  Resumen del Pedido
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mt-0.5">
                  {effectiveCartItems.length} REPUESTOS SUZUKI GENUINE
                </span>
              </div>
            </div>

            {/* Simplified Item List Breakdown */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
              {effectiveCartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-3"
                >
                  {/* Part Thumbnail */}
                  {shouldShowProductImages() ? (
                    <img
                      src={item.part.image}
                      alt={item.part.name}
                      className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <ProductImageEmptyState className="w-12 h-12 shrink-0 rounded-xl" />
                  )}

                  {/* Info & Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[9px] font-bold text-[#E60012] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded inline-block">
                        OEM: {getPrimaryOem(item.part)}
                      </span>
                      {(item.motorcycle || effectiveBike) && (
                        <span className="text-[9px] font-mono text-emerald-700 font-semibold flex items-center gap-0.5 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          {item.motorcycle?.modelName ||
                            effectiveBike?.modelName}
                        </span>
                      )}
                    </div>

                    <h4
                      className="font-bold text-slate-900 text-xs mt-1 leading-tight truncate font-display"
                      title={item.part.name}
                    >
                      {item.part.name}
                    </h4>

                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                      Cant:{" "}
                      <strong className="text-slate-900 font-mono font-bold">
                        {item.quantity}
                      </strong>{" "}
                      ×{" "}
                      <span className="font-mono text-slate-600">
                        {formatCurrency(item.part.price)}
                      </span>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {formatCurrency(item.part.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  CÓDIGO DE DESCUENTO O CUPÓN
                </label>
                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono font-black text-emerald-900">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        {appliedCoupon.type === "percentage"
                          ? `${appliedCoupon.value}% OFF`
                          : `-${formatCurrency(appliedCoupon.value)}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-rose-600 text-[11px] font-bold uppercase cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Ej. SUZUKI10"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 tracking-wider uppercase focus:ring-2 focus:ring-[#E60012]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      Aplicar
                    </button>
                  </div>
                )}

                {couponMessage && (
                  <p
                    className={`text-[11px] font-medium leading-tight mt-1 ${
                      couponMessage.type === "success"
                        ? "text-emerald-700"
                        : "text-rose-600"
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </form>
            </div>

            {/* Financial Totals Breakdown (DESIGN.md Precision Workshop) */}
            <div className="mt-5 pt-4 border-t border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 font-mono">
                <span>Subtotal Repuestos OEM:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(subtotalAmount)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-mono font-bold">
                  <span>
                    Descuento ({appliedCoupon?.code || "Promocional"}):
                  </span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600 font-mono">
                <span>
                  Impuesto (
                  {taxConfig.active
                    ? `${taxConfig.taxRate}% ${taxConfig.taxName}`
                    : "Desactivado"}
                  ):
                </span>
                <span className="font-bold text-slate-900">
                  {taxConfig.active ? `+ ${formatCurrency(taxAmount)}` : "$0"}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 font-mono">
                <span className="flex items-center gap-1 font-sans">
                  <Truck className="w-3.5 h-3.5 text-sky-600" /> Despacho (
                  {selectedShipping?.carrier}):
                </span>
                <span className="font-bold">
                  {actualShippingCost === 0 ? (
                    <span className="text-emerald-600 font-black font-mono">
                      ¡Flete GRATIS!
                    </span>
                  ) : (
                    formatCurrency(actualShippingCost)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-300 font-display">
                <span>Total a Pagar:</span>
                <span className="font-mono text-[#E60012] text-xl font-black">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Guarantee & Chassis Verification Box */}
            <div className="mt-6 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs space-y-2 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#E60012]/20 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Garantía de Ajuste Suzuki</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed relative z-10 font-sans">
                Cada repuesto despachado cuenta con número de referencia OEM
                verificado y garantía legal de ajuste por modelo de motocicleta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
