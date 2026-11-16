import { useEffect, useState } from 'react';
import { Shirt } from 'lucide-react';
import { resolveCatalogAssetUrl } from '../data/catalog';

interface GarmentImageProps {
  src: string;
  alt: string;
  className?: string;
  accentHex?: string;
  showColorSwatchIndicator?: boolean;
}

export function GarmentImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  accentHex,
  showColorSwatchIndicator = false,
}: GarmentImageProps) {
  const resolvedSrc = resolveCatalogAssetUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  if (failed || !resolvedSrc) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F3EFE8] via-[#EBE5DA] to-[#E2D9C9] text-[#6B655E]"
        role="img"
        aria-label={alt}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border border-[#D6CFC3] bg-white/85"
          style={accentHex ? { borderColor: accentHex } : undefined}
        >
          <Shirt className="w-5 h-5 text-[#1C1917]" strokeWidth={1.5} />
        </div>
        <span className="font-display text-lg text-[#1C1917] leading-snug max-w-[18ch]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#F3EFE8]">
      <img
        src={resolvedSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        className={`block ${className}`}
      />
      {showColorSwatchIndicator && accentHex && (
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-3 w-3.5 h-3.5 rounded-full border border-white/90 shadow-sm pointer-events-none"
          style={{ backgroundColor: accentHex }}
        />
      )}
    </div>
  );
}
