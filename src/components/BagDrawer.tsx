import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import {
  formatINR,
  getEffectivePriceInr,
  getVariantStock,
} from '../data/catalog';
import { createOrderInCloud } from '../services/firestoreStore';
import {
  BagItem,
  IndianPaymentMethod,
  OrderReceipt,
  Product,
  StorefrontSettings,
} from '../types';
import { GarmentImage } from './GarmentImage';

interface BagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bagItems: BagItem[];
  products: Product[];
  settings: StorefrontSettings;
  onUpdateQuantity: (
    productId: string,
    colorName: string,
    size: string,
    delta: number,
  ) => void;
  onRemoveItem: (productId: string, colorName: string, size: string) => void;
  onCompleteOrder: (receipt: OrderReceipt) => void;
}

const PAYMENT_OPTIONS: IndianPaymentMethod[] = [
  'UPI (GPay / PhonePe)',
  'Credit / Debit Card',
  'NetBanking',
  'Cash on Delivery (COD)',
];

export function BagDrawer({
  isOpen,
  onClose,
  bagItems,
  products,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteOrder,
}: BagDrawerProps) {
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<IndianPaymentMethod>(
    'UPI (GPay / PhonePe)',
  );
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState('');

  useEffect(() => {
    if (isOpen && bagItems.length > 0 && step === 'confirmed') {
      setStep('bag');
      setReceipt(null);
    }
  }, [isOpen, bagItems.length, step]);

  if (!isOpen) return null;

  const detailedItems = bagItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const available = getVariantStock(product, item.colorName, item.size);
      const unitPriceInr = getEffectivePriceInr(product);
      return { ...item, product, available, unitPriceInr };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotalInr = detailedItems.reduce(
    (sum, item) => sum + item.unitPriceInr * item.quantity,
    0,
  );

  // Storewide or Promo-Code Customer Discount (controlled by Owner Backend)
  const storeDiscountActive =
    Boolean(settings.discountEnabled) && (settings.discountValue ?? 0) > 0;
  const requiredCode = (settings.discountCode ?? '').trim().toUpperCase();
  const minOrderInr = Math.max(0, settings.discountMinOrderInr ?? 0);
  const meetsMinOrder = subtotalInr >= minOrderInr;
  const codeSatisfied = !requiredCode || appliedCode === requiredCode;

  let discountInr = 0;
  if (storeDiscountActive && subtotalInr > 0 && meetsMinOrder && codeSatisfied) {
    const val = settings.discountValue ?? 0;
    const rawDiscount =
      settings.discountType === 'flat'
        ? val
        : Math.round((subtotalInr * Math.min(90, val)) / 100);
    discountInr = Math.max(0, Math.min(subtotalInr - 1, Math.round(rawDiscount)));
  }

  const discountedSubtotal = Math.max(0, subtotalInr - discountInr);
  const freeShippingThreshold = settings.freeShippingAboveInr;
  const shippingInr =
    discountedSubtotal === 0 || discountedSubtotal > freeShippingThreshold
      ? 0
      : settings.shippingChargeInr;
  const totalInr = discountedSubtotal + shippingInr;
  const remainingForFreeShipping =
    freeShippingThreshold <= 0 || discountedSubtotal > freeShippingThreshold
      ? 0
      : freeShippingThreshold + 1 - discountedSubtotal;

  const handleApplyPromo = () => {
    const cleaned = promoInput.trim().toUpperCase();
    if (!storeDiscountActive || !requiredCode) return;
    if (cleaned === requiredCode) {
      setAppliedCode(cleaned);
      setPromoFeedback(`Offer code ${cleaned} applied!`);
    } else {
      setAppliedCode('');
      setPromoFeedback('Invalid promo code. Please check the active offer code.');
    }
  };

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !address.trim()) return;

    const newReceipt: OrderReceipt = {
      orderNumber: `PL-IN-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      phone: phone.trim() || '+91 98201 44210',
      email: email.trim() || 'client@primelook.in',
      address: address.trim(),
      city: city.trim() || 'Mumbai',
      pinCode: pinCode.trim() || '400001',
      paymentMethod,
      items: detailedItems.map((i) => ({
        name: i.product.name,
        colorName: i.colorName,
        size: i.size,
        quantity: i.quantity,
        priceInr: i.unitPriceInr,
      })),
      subtotalInr,
      ...(discountInr > 0
        ? {
            discountInr,
            ...(requiredCode ? { discountCode: requiredCode } : {}),
          }
        : {}),
      shippingInr,
      totalInr,
      estimatedDelivery: '4–6 Days (Pan-India Delivery)',
    };

    setSubmitting(true);
    setCheckoutError('');
    try {
      await createOrderInCloud(newReceipt);
      setReceipt(newReceipt);
      onCompleteOrder(newReceipt);
      setStep('confirmed');
    } catch {
      setCheckoutError(
        'Could not submit order to server. Please check all details and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDrawer = () => {
    if (step === 'confirmed') {
      setStep('bag');
      setReceipt(null);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1C1917]/60 backdrop-blur-sm overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      onClick={handleCloseDrawer}
    >
      <div
        className="w-full sm:max-w-md h-full bg-[#FFFFFF] flex flex-col shadow-2xl border-l border-[#E6DFD3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 h-16 bg-[#144534] text-white border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className="font-display text-2xl font-medium">
            {step === 'bag'
              ? 'Shopping Cart'
              : step === 'checkout'
                ? 'India Express Checkout'
                : 'Order Confirmed'}
          </h2>
          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="Close bag"
            className="w-11 h-11 flex items-center justify-center rounded-full text-white/85 hover:bg-white/15 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">
          {step === 'confirmed' && receipt ? (
            <div className="py-4 space-y-5">
              <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3]">
                <div className="flex items-center gap-2.5 text-[#1C1917]">
                  <CheckCircle2 className="w-5 h-5 text-[#144534] shrink-0" />
                  <span className="text-sm font-semibold">
                    Order #{receipt.orderNumber} Confirmed — Preparing Dispatch
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#6B655E] leading-relaxed">
                  Estimated arrival: {receipt.estimatedDelivery}. GST tax
                  invoice &amp; tracking link sent to {receipt.email}.
                </p>
              </div>

              <div className="space-y-1.5 text-sm border-b border-[#F3EFE8] pb-4">
                <p className="text-xs uppercase tracking-wider text-[#6B655E]">
                  Delivery Address
                </p>
                <p className="font-medium text-[#1C1917]">
                  {receipt.customerName} · {receipt.phone}
                </p>
                <p className="text-[#6B655E] text-xs">
                  {receipt.address}, {receipt.city} — PIN {receipt.pinCode}
                </p>
                <p className="text-xs text-[#6B655E]">
                  Payment Method: {receipt.paymentMethod}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-[#6B655E]">
                  Order Summary
                </p>
                {receipt.items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[#1C1917]">{item.name}</p>
                      <p className="text-xs text-[#6B655E]">
                        {item.colorName} · Size {item.size} · Qty{' '}
                        {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium tabular-nums text-[#1C1917]">
                      {formatINR(item.priceInr * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#E6DFD3] space-y-1.5 text-sm">
                <div className="flex justify-between text-[#6B655E]">
                  <span>Subtotal (Incl. GST)</span>
                  <span className="tabular-nums">
                    {formatINR(receipt.subtotalInr)}
                  </span>
                </div>
                {(receipt.discountInr ?? 0) > 0 && (
                  <div className="flex justify-between font-semibold text-[#144534]">
                    <span>
                      Customer Discount
                      {receipt.discountCode ? ` (${receipt.discountCode})` : ''}
                    </span>
                    <span className="tabular-nums">
                      -{formatINR(receipt.discountInr ?? 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B655E]">
                  <span>Pan-India Express Courier</span>
                  <span className="tabular-nums">
                    {receipt.shippingInr === 0
                      ? 'Complimentary'
                      : formatINR(receipt.shippingInr)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-[#1C1917] pt-2 border-t border-[#F3EFE8]">
                  <span>Total Amount</span>
                  <span className="tabular-nums">
                    {formatINR(receipt.totalInr)}
                  </span>
                </div>
              </div>
            </div>
          ) : detailedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-14 h-14 rounded-full bg-[#F3EFE8] flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6 text-[#6B655E]" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-semibold text-[#1C1917]">
                Your cart is empty
              </h3>
              <p className="mt-1.5 text-sm text-[#6B655E] max-w-xs">
                Explore Giza 45 dress shirts, linen bandhgalas, and 260gsm
                Supima crewneck tees.
              </p>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="mt-6 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#144534] text-white text-sm font-medium hover:bg-[#0E3427] cursor-pointer"
              >
                Explore Collection
              </button>
            </div>
          ) : step === 'checkout' ? (
            <form
              id="checkout-form"
              onSubmit={handleCheckoutSubmit}
              className="space-y-4"
            >
              <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] flex items-center justify-between text-xs">
                <span className="text-[#6B655E]">
                  {detailedItems.reduce((s, i) => s + i.quantity, 0)} items ·{' '}
                  {shippingInr === 0
                    ? 'Free Pan-India Express'
                    : `${formatINR(shippingInr)} Express Courier`}
                </span>
                <span className="font-semibold text-[#1C1917] tabular-nums">
                  {formatINR(totalInr)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Aarav Mehta"
                    className="w-full min-h-[44px] px-3.5 rounded-lg border border-[#E6DFD3] text-sm text-[#1C1917] focus:outline-none focus:border-[#144534]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                    Mobile (+91)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98201 44210"
                    className="w-full min-h-[44px] px-3.5 rounded-lg border border-[#E6DFD3] text-sm text-[#1C1917] focus:outline-none focus:border-[#144534]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                  Email for GST Invoice &amp; Tracking
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav@example.in"
                  className="w-full min-h-[44px] px-3.5 rounded-lg border border-[#E6DFD3] text-sm text-[#1C1917] focus:outline-none focus:border-[#144534]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                  Delivery Address (House / Apartment / Street)
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="18 Marine Drive, Churchgate"
                  className="w-full min-h-[44px] px-3.5 rounded-lg border border-[#E6DFD3] text-sm text-[#1C1917] focus:outline-none focus:border-[#144534]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                    City &amp; State
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai, MH"
                    className="w-full min-h-[44px] px-3.5 rounded-lg border border-[#E6DFD3] text-sm text-[#1C1917] focus:outline-none focus:border-[#144534]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                    6-Digit PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="400020"
                    className="w-full min-h-[44px] px-3.5 rounded-lg border border-[#E6DFD3] text-sm font-mono tabular-nums text-[#1C1917] focus:outline-none focus:border-[#144534]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-[#1C1917] mb-2">
                  Select Payment Method
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`min-h-[44px] px-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        paymentMethod === method
                          ? 'border-[#144534] bg-[#144534] text-white'
                          : 'border-[#E6DFD3] bg-white text-[#1C1917] hover:border-[#144534]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Free shipping indicator */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#D6CFC3]">
                <p className="text-xs font-bold text-black">
                  {remainingForFreeShipping === 0
                    ? `FREE delivery unlocked (orders above ₹${freeShippingThreshold}).`
                    : `Add ${formatINR(remainingForFreeShipping)} more for FREE delivery (₹${settings.shippingChargeInr} charge up to ₹${freeShippingThreshold}).`}
                </p>
                <div className="mt-2 h-1.5 w-full bg-[#E6DFD3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#144534] transition-all duration-300"
                    style={{
                      width: `${
                        freeShippingThreshold > 0
                          ? Math.min(
                              100,
                              (discountedSubtotal / freeShippingThreshold) * 100,
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Owner-Configured Customer Discount / Promo Offer */}
              {storeDiscountActive && (
                <div className="p-3 rounded-lg bg-[#144534]/5 border border-[#144534]/25 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#144534]">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {settings.discountTitle || 'Customer Discount'}:{' '}
                        {settings.discountType === 'flat'
                          ? `${formatINR(settings.discountValue ?? 0)} OFF`
                          : `${settings.discountValue ?? 0}% OFF`}
                      </span>
                    </div>
                    {discountInr > 0 && (
                      <span className="text-xs font-bold text-[#144534] tabular-nums">
                        -{formatINR(discountInr)}
                      </span>
                    )}
                  </div>

                  {!meetsMinOrder && minOrderInr > 0 && (
                    <p className="text-[11px] font-medium text-[#57524C]">
                      Add {formatINR(minOrderInr - subtotalInr)} more (min order{' '}
                      {formatINR(minOrderInr)}) to unlock this discount.
                    </p>
                  )}

                  {requiredCode && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) =>
                            setPromoInput(e.target.value.toUpperCase())
                          }
                          placeholder={`Enter code (${requiredCode})`}
                          className="flex-1 min-h-[36px] px-2.5 rounded-lg border border-[#D6CFC3] bg-white text-xs font-mono text-[#1C1917]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          className="min-h-[36px] px-3 rounded-lg bg-[#144534] text-white text-xs font-semibold hover:bg-[#0E3427] cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setPromoInput(requiredCode);
                            setAppliedCode(requiredCode);
                            setPromoFeedback(`Offer code ${requiredCode} applied!`);
                          }}
                          className="font-bold text-[#144534] underline underline-offset-2 cursor-pointer"
                        >
                          Tap to apply {requiredCode}
                        </button>
                        {promoFeedback && (
                          <span className="font-semibold text-[#144534]">
                            {promoFeedback}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bag Line Items */}
              <div className="divide-y divide-[#F3EFE8]">
                {detailedItems.map((item) => (
                  <div
                    key={`${item.productId}-${item.colorName}-${item.size}`}
                    className="py-4 flex gap-3.5"
                  >
                    <div className="w-20 h-26 rounded-lg overflow-hidden bg-[#F3EFE8] shrink-0 border border-[#E6DFD3]">
                      <GarmentImage
                        src={item.previewImage || item.product.image}
                        alt={item.product.name}
                        accentHex={item.colorHex}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#1C1917] leading-snug line-clamp-2">
                            {item.product.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveItem(
                                item.productId,
                                item.colorName,
                                item.size,
                              )
                            }
                            aria-label={`Remove ${item.product.name}`}
                            className="w-9 h-9 -mr-1.5 -mt-1.5 flex items-center justify-center text-[#6B655E] hover:text-[#8C2D2D] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#6B655E]">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/15"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span>{item.colorName}</span>
                          <span aria-hidden="true">·</span>
                          <span>Size {item.size}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#E6DFD3] rounded-lg">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(
                                item.productId,
                                item.colorName,
                                item.size,
                                -1,
                              )
                            }
                            aria-label="Decrease quantity"
                            className="w-10 h-10 flex items-center justify-center text-[#1C1917] hover:bg-[#F3EFE8] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.available}
                            onClick={() =>
                              onUpdateQuantity(
                                item.productId,
                                item.colorName,
                                item.size,
                                1,
                              )
                            }
                            aria-label="Increase quantity"
                            className="w-10 h-10 flex items-center justify-center text-[#1C1917] hover:bg-[#F3EFE8] disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-semibold text-[#1C1917] tabular-nums">
                          {formatINR(item.unitPriceInr * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {detailedItems.length > 0 && step !== 'confirmed' && (
          <div className="p-5 border-t border-[#E6DFD3] bg-[#FAF8F5] pb-safe space-y-3 shrink-0">
            {step === 'bag' ? (
              <>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B655E]">Subtotal (Incl. GST)</span>
                    <span className="font-semibold text-[#1C1917] tabular-nums">
                      {formatINR(subtotalInr)}
                    </span>
                  </div>
                  {discountInr > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold text-[#144534]">
                      <span>
                        {settings.discountTitle || 'Customer Discount'}
                        {requiredCode ? ` (${requiredCode})` : ''}
                      </span>
                      <span className="tabular-nums">
                        -{formatINR(discountInr)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E6DFD3]">
                    <span className="font-semibold text-[#1C1917]">
                      Estimated Total
                    </span>
                    <span className="text-base font-bold text-[#144534] tabular-nums">
                      {formatINR(totalInr)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#144534] text-white text-sm font-semibold hover:bg-[#0E3427] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </>
            ) : (
              <div className="space-y-2">
                {checkoutError && (
                  <p className="text-xs font-semibold text-[#8C2D2D]">
                    {checkoutError}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setStep('bag')}
                    className="min-h-[48px] px-4 rounded-xl border border-[#E6DFD3] bg-white text-sm font-medium text-[#1C1917] hover:bg-[#F3EFE8] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    form="checkout-form"
                    className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#144534] text-white text-sm font-semibold hover:bg-[#0E3427] disabled:opacity-60 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {submitting
                      ? 'Placing Order...'
                      : `Place Order — ${formatINR(totalInr)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'confirmed' && (
          <div className="p-5 border-t border-[#E6DFD3] bg-[#FAF8F5] pb-safe shrink-0">
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#144534] text-white text-sm font-semibold hover:bg-[#0E3427] cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
