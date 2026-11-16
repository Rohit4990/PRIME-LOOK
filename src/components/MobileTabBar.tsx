import { Palette, ShieldCheck, ShoppingBag, Store } from 'lucide-react';

interface MobileTabBarProps {
  bagCount: number;
  onSelectShop: () => void;
  onFocusColors: () => void;
  onSelectPolicies: () => void;
  onOpenBag: () => void;
}

export function MobileTabBar({
  bagCount,
  onSelectShop,
  onFocusColors,
  onSelectPolicies,
  onOpenBag,
}: MobileTabBarProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6DFD3] pb-safe text-[#1C1917]"
    >
      <div className="grid grid-cols-4 items-center h-[52px]">
        <button
          type="button"
          onClick={onSelectShop}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[#144534] font-semibold transition-colors cursor-pointer"
        >
          <Store className="w-[19px] h-[19px]" strokeWidth={1.85} />
          <span className="text-[10px] leading-none tracking-tight whitespace-nowrap">
            Shop
          </span>
        </button>

        <button
          type="button"
          onClick={onFocusColors}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[#6B655E] hover:text-[#144534] font-medium transition-colors cursor-pointer"
        >
          <Palette className="w-[19px] h-[19px]" strokeWidth={1.75} />
          <span className="text-[10px] leading-none tracking-tight whitespace-nowrap">
            Shades
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectPolicies}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[#6B655E] hover:text-[#144534] font-medium transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-[19px] h-[19px]" strokeWidth={1.75} />
          <span className="text-[10px] leading-none tracking-tight whitespace-nowrap">
            Policies
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenBag}
          className="min-h-[44px] relative flex flex-col items-center justify-center gap-0.5 text-[#6B655E] hover:text-[#144534] font-medium transition-colors cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.75} />
            {bagCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#144534] text-white text-[9px] font-bold tabular-nums flex items-center justify-center">
                {bagCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none tracking-tight whitespace-nowrap">
            Cart
          </span>
        </button>
      </div>
    </nav>
  );
}
