import { useEffect } from 'react';
import {
  RefreshCw,
  Ruler,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { SHIRT_SIZE_CHART, TEE_POLO_SIZE_CHART } from '../data/catalog';
import { StorefrontSettings } from '../types';

export type PolicyTab = 'delivery' | 'returns' | 'care' | 'terms';

interface PolicyModalProps {
  activePolicy: PolicyTab | null;
  settings: StorefrontSettings;
  onSelectPolicy: (tab: PolicyTab) => void;
  onClose: () => void;
}

const TAB_ICONS: Record<PolicyTab, typeof Truck> = {
  delivery: Truck,
  returns: RefreshCw,
  care: Ruler,
  terms: ShieldCheck,
};

export function PolicyModal({
  activePolicy,
  settings,
  onSelectPolicy,
  onClose,
}: PolicyModalProps) {
  useEffect(() => {
    if (!activePolicy) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePolicy, onClose]);

  if (!activePolicy) return null;

  const policyContent: Record<
    PolicyTab,
    {
      tabLabel: string;
      title: string;
      summary: string;
      points: Array<{ label: string; detail: string }>;
    }
  > = {
    delivery: {
      tabLabel: 'Shipping & Delivery',
      title: 'Shipping & Delivery Policy',
      summary: `Orders above ₹${settings.freeShippingAboveInr} ship FREE across India. Orders up to ₹${settings.freeShippingAboveInr} carry a flat ₹${settings.shippingChargeInr} delivery charge.`,
      points: [
        {
          label: 'Delivery Charges',
          detail: `FREE delivery on orders above ₹${settings.freeShippingAboveInr}. Flat ₹${settings.shippingChargeInr} charge for orders of ₹${settings.freeShippingAboveInr} or less.`,
        },
        {
          label: 'Delivery Time',
          detail: settings.deliveryDaysText,
        },
        {
          label: 'COD & Tracking',
          detail:
            'Cash on Delivery (COD) available pan-India with live SMS & email tracking.',
        },
      ],
    },
    returns: {
      tabLabel: `${settings.returnWindowDays}-Day Returns`,
      title: `${settings.returnWindowDays}-Day Return & Exchange Policy`,
      summary: `Easy ${settings.returnWindowDays}-day returns and size exchanges across India. Delivery charges will be deducted on item returns.`,
      points: [
        {
          label: `${settings.returnWindowDays}-Day Return Window`,
          detail: `Return or exchange unworn items with original tags within ${settings.returnWindowDays} days of delivery.`,
        },
        {
          label: 'Delivery Charge Deduction',
          detail: settings.returnDeductionText,
        },
        {
          label: 'Fast Refunds (48 Hours)',
          detail:
            'Refunds are credited to your UPI, Card, or Bank account within 48 hours of pickup.',
        },
      ],
    },
    care: {
      tabLabel: 'Care & Sizing',
      title: 'Fabric Care & Sizing',
      summary:
        'All shirts and tees are pre-shrunk for a clean Indian tailored fit.',
      points: [
        {
          label: 'Gentle Cold Wash',
          detail:
            'Wash cold at 30°C with mild detergent. Dry in shade and steam press inside-out.',
        },
        {
          label: 'True Indian Sizing',
          detail: 'Shirts: 38 (S) to 46 (XXL). T-Shirts & Polos: S to XXL.',
        },
        {
          label: 'Spare Buttons & Stays',
          detail:
            'Every dress shirt includes spare mother-of-pearl buttons and collar stays.',
        },
      ],
    },
    terms: {
      tabLabel: 'GST & Privacy',
      title: 'GST Billing & Authenticity',
      summary:
        'All prices are GST-inclusive in INR (₹) with 256-bit encrypted checkout.',
      points: [
        {
          label: 'GST-Inclusive Prices',
          detail:
            'No hidden taxes at checkout. GST invoice emailed automatically on dispatch.',
        },
        {
          label: '100% Natural Fibers',
          detail:
            'Guaranteed pure Giza 45 cotton, Belgian flax linen, and 260gsm Supima cotton.',
        },
        {
          label: 'Secure Checkout',
          detail: 'All UPI, Card, NetBanking, and COD orders are 100% protected.',
        },
      ],
    },
  };

  const current = policyContent[activePolicy];
  const ActiveIcon = TAB_ICONS[activePolicy];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/65 backdrop-blur-sm p-0 md:p-6 overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-2xl max-h-[88vh] bg-[#FFFFFF] rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-[#D6CFC3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="md:hidden flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-[#D6CFC3]" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[#E6DFD3] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] flex items-center justify-center shrink-0">
              <ActiveIcon className="w-5 h-5 text-black" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#144534]">
                Store Policies
              </p>
              <h2
                id="policy-modal-title"
                className="font-display text-xl sm:text-2xl font-bold text-black leading-tight"
              >
                {current.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close policy details"
            className="w-10 h-10 flex items-center justify-center rounded-full text-black hover:bg-[#F3EFE8] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switcher Tabs inside Modal */}
        <div className="px-5 sm:px-7 pt-3 pb-2.5 bg-[#FAF8F5] border-b border-[#E6DFD3] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {(['delivery', 'returns', 'care', 'terms'] as const).map((tab) => {
            const TabIcon = TAB_ICONS[tab];
            const isSelected = activePolicy === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onSelectPolicy(tab)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#144534] text-white'
                    : 'bg-white text-black border border-[#D6CFC3] hover:border-black'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{policyContent[tab].tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Short, Clear & Bold Black Policy Details */}
        <div className="flex-1 min-h-0 p-5 sm:p-7 overflow-y-auto overscroll-contain space-y-4">
          <p className="text-sm sm:text-base font-bold text-black leading-snug">
            {current.summary}
          </p>

          <div className="grid grid-cols-1 gap-3">
            {current.points.map((point) => (
              <div
                key={point.label}
                className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3]"
              >
                <h3 className="text-sm font-bold text-black">{point.label}</h3>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-black leading-relaxed">
                  {point.detail}
                </p>
              </div>
            ))}
          </div>

          {activePolicy === 'care' && (
            <div className="space-y-3 pt-1">
              <div className="rounded-xl border border-[#D6CFC3] bg-[#FAF8F5] overflow-hidden">
                <div className="px-4 py-2.5 bg-white border-b border-[#E6DFD3]">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                    Original Shirts Size Chart (Inches)
                  </h4>
                </div>
                <table className="w-full text-left text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-[#E6DFD3] text-[#57524C] font-bold">
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Chest</th>
                      <th className="py-2 px-3">Shoulder</th>
                      <th className="py-2 px-3">Length</th>
                      <th className="py-2 px-3">Collar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD3] text-black font-medium">
                    {SHIRT_SIZE_CHART.map((row) => (
                      <tr key={row.size}>
                        <td className="py-2 px-3 font-bold">{row.size}</td>
                        <td className="py-2 px-3">{row.chestIn}&quot;</td>
                        <td className="py-2 px-3">{row.shoulderIn}&quot;</td>
                        <td className="py-2 px-3">{row.lengthIn}&quot;</td>
                        <td className="py-2 px-3">{row.fourthMetricIn}&quot;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-[#D6CFC3] bg-[#FAF8F5] overflow-hidden">
                <div className="px-4 py-2.5 bg-white border-b border-[#E6DFD3]">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                    Original T-Shirts &amp; Polos Size Chart (Inches)
                  </h4>
                </div>
                <table className="w-full text-left text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-[#E6DFD3] text-[#57524C] font-bold">
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Chest</th>
                      <th className="py-2 px-3">Shoulder</th>
                      <th className="py-2 px-3">Length</th>
                      <th className="py-2 px-3">Sleeve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD3] text-black font-medium">
                    {TEE_POLO_SIZE_CHART.map((row) => (
                      <tr key={row.size}>
                        <td className="py-2 px-3 font-bold">{row.size}</td>
                        <td className="py-2 px-3">{row.chestIn}&quot;</td>
                        <td className="py-2 px-3">{row.shoulderIn}&quot;</td>
                        <td className="py-2 px-3">{row.lengthIn}&quot;</td>
                        <td className="py-2 px-3">{row.fourthMetricIn}&quot;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 bg-[#FAF8F5] border-t border-[#E6DFD3] pb-safe flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-black">
            Helpdesk: <span className="font-bold text-black">{settings.phone}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-lg bg-[#144534] text-white text-xs sm:text-sm font-bold hover:bg-[#0E3427] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
