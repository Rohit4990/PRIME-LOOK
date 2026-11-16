import { StorefrontSettings } from '../types';

interface BrandLogoProps {
  variant?: 'header' | 'footer';
  settings?: StorefrontSettings;
}

export function BrandLogo({ variant = 'header', settings }: BrandLogoProps) {
  const isFooter = variant === 'footer';
  const brandName = settings?.brandName || 'Prime Look';
  const tagline = settings?.tagline || 'Menswear India';

  if (settings?.logoDataUrl) {
    return (
      <span className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
        <img
          src={settings.logoDataUrl}
          alt={`${brandName} Logo`}
          className={`${
            isFooter ? 'h-10 max-w-[160px]' : 'h-8 md:h-9 max-w-[140px]'
          } w-auto object-contain rounded-md`}
        />
        {settings.showWordmark && (
          <span className="flex flex-col leading-none">
            <span
              className={`font-display text-xl md:text-[24px] font-semibold tracking-[0.05em] leading-none ${
                isFooter ? 'text-white' : 'text-[#1C1917]'
              }`}
            >
              {brandName}
            </span>
            <span
              className={`text-[9px] uppercase tracking-[0.26em] font-medium mt-0.5 ${
                isFooter ? 'text-[#D6B376]' : 'text-[#8C6A36]'
              }`}
            >
              {tagline}
            </span>
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
      {/* Custom Bespoke Prime Look Crest Emblem */}
      <svg
        width={isFooter ? 38 : 34}
        height={isFooter ? 38 : 34}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2.5"
          y="2.5"
          width="35"
          height="35"
          rx="9"
          fill={isFooter ? '#26221F' : '#144534'}
          stroke="#C89E5D"
          strokeWidth="1.4"
        />
        <rect
          x="5.5"
          y="5.5"
          width="29"
          height="29"
          rx="6"
          stroke="#C89E5D"
          strokeOpacity="0.4"
          strokeWidth="0.9"
        />
        {/* Crown Apex Accent */}
        <path
          d="M15.5 11.5L20 8.5L24.5 11.5"
          stroke="#D6B376"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Interlocking P·L Monogram */}
        <path
          d="M12.5 27.5V14.5H17.8C19.9 14.5 21.4 15.8 21.4 17.8C21.4 19.8 19.9 21.1 17.8 21.1H12.5"
          stroke="#FFFFFF"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.2 14.5V27.5H28.8"
          stroke="#D6B376"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-xl md:text-[24px] font-semibold tracking-[0.05em] leading-none ${
            isFooter ? 'text-white' : 'text-[#1C1917]'
          }`}
        >
          {brandName}
        </span>
        <span
          className={`text-[9px] uppercase tracking-[0.26em] font-medium mt-0.5 ${
            isFooter ? 'text-[#D6B376]' : 'text-[#8C6A36]'
          }`}
        >
          {tagline}
        </span>
      </span>
    </span>
  );
}
