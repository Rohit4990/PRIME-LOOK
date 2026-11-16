import { ArrowRight } from 'lucide-react';
import { HERO_INDIA_IMAGE } from '../data/catalog';
import { StorefrontSettings } from '../types';
import { GarmentImage } from './GarmentImage';

interface HeroSectionProps {
  settings: StorefrontSettings;
  onExploreClick: () => void;
}

export function HeroSection({ settings, onExploreClick }: HeroSectionProps) {
  const hasActiveDiscount =
    Boolean(settings.discountEnabled) && (settings.discountValue ?? 0) > 0;
  const discountSummary = hasActiveDiscount
    ? `${settings.discountTitle || 'Special Offer'}: ${
        settings.discountType === 'flat'
          ? `₹${settings.discountValue} OFF`
          : `${settings.discountValue}% OFF`
      }${
        settings.discountCode?.trim()
          ? ` · Use code ${settings.discountCode.trim().toUpperCase()}`
          : ' · Applied automatically in Cart'
      }`
    : null;

  return (
    <section
      id="top"
      className="w-full overflow-x-clip bg-gradient-to-b from-white via-[#FAF8F5] to-[#F3EFE8] text-[#1C1917] border-b border-[#E6DFD3]"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center">
          {/* Editorial Copy Column */}
          <div className="lg:col-span-5 min-w-0 flex flex-col justify-center py-2 lg:py-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[1.5px] bg-[#B88A44] shrink-0" aria-hidden="true" />
              <p className="text-[11px] sm:text-xs font-bold tracking-[0.22em] uppercase text-[#8C6A36]">
                {settings.brandName} • Men&rsquo;s Collection
              </p>
            </div>

            <h1
              className="font-display font-semibold uppercase text-[#1C1917] tracking-[0.02em] leading-[0.98]"
              style={{ fontSize: 'clamp(2.15rem, 4.2vw, 4rem)' }}
            >
              Elevate Your
              <span className="block italic font-medium text-[#144534] mt-0.5">
                Everyday Style.
              </span>
            </h1>

            <div className="mt-5 pl-3.5 border-l-2 border-[#B88A44] space-y-1.5 max-w-md">
              <p className="text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase text-[#1C1917]">
                Premium Men&rsquo;s Shirts &amp; T-Shirts
              </p>
              <p className="text-sm md:text-[15px] text-[#57524C] leading-relaxed">
                Redefine your wardrobe with timeless fashion and effortless
                sophistication.
              </p>
            </div>

            <div className="mt-7 md:mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onExploreClick}
                className="min-h-[48px] px-7 py-3.5 bg-[#144534] text-white text-xs font-bold tracking-[0.16em] uppercase rounded-lg hover:bg-[#0E3427] active:scale-[0.98] transition-all inline-flex items-center gap-3 whitespace-nowrap cursor-pointer shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#144534]"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Sunlit Model Campaign Column — exact 16:9 aspect match with zero extra side space */}
          <div className="lg:col-span-7 min-w-0 w-full">
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#E6DFD3] bg-[#EDE7DC] shadow-md">
              <GarmentImage
                src={HERO_INDIA_IMAGE}
                alt="Prime Look India menswear male model in crisp ivory Giza 45 dress shirt at sunlit courtyard"
                className="w-full h-full object-cover object-[center_18%]"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-[#1C1917]/85 via-[#1C1917]/35 to-transparent text-white">
                <p className="text-[11px] sm:text-xs text-[#E3C58E] font-medium tracking-wider uppercase">
                  {discountSummary ||
                    'Autumn / Resort Edit · GST-Inclusive INR Pricing'}
                </p>
                <p className="font-display text-lg sm:text-2xl font-medium mt-0.5 text-white">
                  FREE pan-India delivery above ₹{settings.freeShippingAboveInr} · ₹{settings.shippingChargeInr} otherwise
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 3-Column India Flagship Assurance Strip */}
        <div className="mt-8 pt-6 border-t border-[#E6DFD3] grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="text-xs text-[#6B655E]">Pan-India Delivery</p>
            <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#1C1917]">
              Free Above ₹{settings.freeShippingAboveInr}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6B655E]">{settings.returnWindowDays}-Day Returns</p>
            <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#144534]">
              Easy Size Swaps
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6B655E]">Indian Checkout</p>
            <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#1C1917]">
              UPI · Cards · COD
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
