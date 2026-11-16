import { ShoppingBag } from 'lucide-react';
import { StorefrontSettings } from '../types';
import { BrandLogo } from './BrandLogo';
import { PolicyTab } from './PolicyModal';

interface HeaderProps {
  bagCount: number;
  settings: StorefrontSettings;
  onNavigateSection: (sectionId: string, category?: string) => void;
  onOpenPolicy: (tab: PolicyTab) => void;
  onOpenBag: () => void;
}

export function Header({
  bagCount,
  settings,
  onNavigateSection,
  onOpenPolicy,
  onOpenBag,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6DFD3] text-[#1C1917]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 md:h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Clean Brand Logo */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigateSection('top');
          }}
          className="whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#144534]"
        >
          <BrandLogo variant="header" settings={settings} />
        </a>

        {/* Zone 2: 4 single-line text nav links (Desktop) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#57524C]"
        >
          <button
            type="button"
            onClick={() => onNavigateSection('collection', 'Shirts')}
            className="py-1 border-b-2 border-transparent hover:text-[#144534] hover:border-[#144534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Shirts
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('collection', 'T-Shirts')}
            className="py-1 border-b-2 border-transparent hover:text-[#144534] hover:border-[#144534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            T-Shirts
          </button>
          <button
            type="button"
            onClick={() => onOpenPolicy('delivery')}
            className="py-1 border-b-2 border-transparent hover:text-[#144534] hover:border-[#144534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Delivery &amp; Returns
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('contact')}
            className="py-1 border-b-2 border-transparent hover:text-[#144534] hover:border-[#144534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenBag}
            aria-label={`Open shopping cart, ${bagCount} items`}
            className="min-h-[38px] md:min-h-[42px] px-3.5 md:px-4.5 py-1.5 inline-flex items-center gap-2 text-xs md:text-sm font-semibold bg-[#144534] text-white rounded-lg hover:bg-[#0E3427] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#144534]"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.85} />
            <span className="tabular-nums">Cart ({bagCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
