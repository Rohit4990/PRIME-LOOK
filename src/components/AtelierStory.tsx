import { useRef } from 'react';
import {
  ChevronRight,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { StorefrontSettings } from '../types';
import { BrandLogo } from './BrandLogo';
import { PolicyTab } from './PolicyModal';

interface AtelierStoryProps {
  settings: StorefrontSettings;
  onOpenPolicy: (tab: PolicyTab) => void;
  onOpenOwnerBackend: () => void;
}

export function AtelierStory({
  settings,
  onOpenPolicy,
  onOpenOwnerBackend,
}: AtelierStoryProps) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<number | null>(null);

  const handleSecretCopyrightTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
    }
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      onOpenOwnerBackend();
      return;
    }
    tapTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 1800);
  };

  const serviceIcons: Array<{
    id: PolicyTab;
    title: string;
    subtitle: string;
    icon: typeof Truck;
  }> = [
    {
      id: 'delivery',
      title: 'Shipping & Delivery',
      subtitle: `Free above ₹${settings.freeShippingAboveInr} · ₹${settings.shippingChargeInr} otherwise`,
      icon: Truck,
    },
    {
      id: 'returns',
      title: `${settings.returnWindowDays}-Day Returns`,
      subtitle: 'Delivery charge deducted on return',
      icon: RefreshCw,
    },
    {
      id: 'care',
      title: 'Care & Sizing',
      subtitle: '',
      icon: Ruler,
    },
    {
      id: 'terms',
      title: 'GST & Authenticity',
      subtitle: '100% natural fibers · Encrypted',
      icon: ShieldCheck,
    },
  ];

  return (
    <>
      {/* 1. Clean Compact Clickable Service Icons Bar */}
      <section
        id="policies"
        aria-label="Client Care Services"
        className="bg-[#FFFFFF] border-t border-[#E6DFD3] py-8 md:py-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {serviceIcons.map(({ id, title, subtitle, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onOpenPolicy(id)}
                className="group p-4 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] hover:border-[#144534] hover:bg-white transition-all text-left flex items-center gap-3.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#144534]"
              >
                <div className="w-11 h-11 rounded-lg bg-white border border-[#D6CFC3] group-hover:border-[#144534] group-hover:bg-[#144534] flex items-center justify-center shrink-0 transition-colors">
                  <Icon
                    className="w-5 h-5 text-black group-hover:text-white transition-colors"
                    strokeWidth={2}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black group-hover:text-[#144534] transition-colors truncate">
                    {title}
                  </p>
                  {subtitle && (
                    <p className="text-xs font-semibold text-black mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                <ChevronRight
                  className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform shrink-0"
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Flagship India Contact & Payments Footer (Zero admin UI shown to shoppers) */}
      <footer
        id="contact"
        className="bg-[#1C1917] text-[#FAF8F5] border-t border-[#E6DFD3]/15 pt-12 md:pt-14 pb-24 md:pb-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-white/10">
            {/* Brand & Flagship Address */}
            <div className="lg:col-span-4 space-y-4">
              <BrandLogo variant="footer" settings={settings} />
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-sm">
                India&rsquo;s premier men&rsquo;s shirting and Supima jersey
                house — crafted in breathable natural fibers with timeless
                tailored precision.
              </p>
              <div className="pt-1 flex items-start gap-2.5 text-xs text-white/80">
                <MapPin className="w-4 h-4 text-[#D6B376] shrink-0 mt-0.5" />
                <span>Flagship Store: {settings.address}</span>
              </div>
            </div>

            {/* Direct Contact & Boutiques */}
            <div className="lg:col-span-4 space-y-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D6B376]">
                Client Concierge &amp; Showrooms
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-white/85">
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#D6B376] shrink-0" />
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                    className="hover:text-[#D6B376] transition-colors tabular-nums"
                  >
                    {settings.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#D6B376] shrink-0" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="hover:text-[#D6B376] transition-colors"
                  >
                    {settings.email}
                  </a>
                </li>
                <li className="flex items-center gap-2.5 text-white/70">
                  <Clock className="w-4 h-4 text-[#D6B376] shrink-0" />
                  <span>{settings.hours}</span>
                </li>
              </ul>
              <p className="text-xs text-white/60 pt-1">
                Showrooms: {settings.showrooms}
              </p>
            </div>

            {/* Policies Links + Accepted Indian Payment Methods */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D6B376]">
                Accepted Payments &amp; Policies
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {[
                  'UPI · GPay · PhonePe',
                  'Visa / Mastercard / RuPay',
                  'All Indian NetBanking',
                  'Cash on Delivery (COD)',
                ].map((pm) => (
                  <div
                    key={pm}
                    className="px-3 py-2.5 rounded-lg bg-white/6 border border-white/12 text-[11px] font-medium text-white/90 flex items-center gap-2"
                  >
                    <CreditCard
                      className="w-3.5 h-3.5 text-[#D6B376] shrink-0"
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{pm}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/75 pt-1">
                {(
                  [
                    { id: 'delivery', label: 'Shipping Policy' },
                    {
                      id: 'returns',
                      label: `${settings.returnWindowDays}-Day Returns`,
                    },
                    { id: 'care', label: 'Size & Care' },
                    { id: 'terms', label: 'GST & Privacy' },
                  ] as const
                ).map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => onOpenPolicy(link.id)}
                    className="hover:text-[#D6B376] underline underline-offset-4 decoration-white/30 cursor-pointer"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/55">
            <p onClick={handleSecretCopyrightTap} className="select-none">
              © 2026 {settings.brandName} India. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span>256-Bit SSL Encrypted Checkout · GSTIN Verified Retail</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
