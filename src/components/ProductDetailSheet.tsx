import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import {
  formatINR,
  getColorStock,
  getEffectivePriceInr,
  getProductGalleryImages,
  getSizeChartForCategory,
  getVariantStock,
} from '../data/catalog';
import { BagItem, Product } from '../types';
import { GarmentImage } from './GarmentImage';

interface ProductDetailSheetProps {
  product: Product | null;
  initialColorName?: string;
  bagItems: BagItem[];
  bagCount: number;
  onClose: () => void;
  onAddToBag: (
    product: Product,
    colorName: string,
    colorHex: string,
    previewImage: string,
    size: string,
  ) => void;
  onGoToCart: () => void;
}

function formatCm(inches: number): string {
  return (inches * 2.54).toFixed(1);
}

export function ProductDetailSheet({
  product,
  initialColorName,
  bagItems,
  bagCount,
  onClose,
  onAddToBag,
  onGoToCart,
}: ProductDetailSheetProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(true);
  const [sizeUnit, setSizeUnit] = useState<'in' | 'cm'>('in');
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!product) return;
    const defaultColor =
      initialColorName &&
      product.colors.some((c) => c.name === initialColorName)
        ? initialColorName
        : product.colors[0]?.name ?? '';
    setSelectedColor(defaultColor);

    const firstInStockSize =
      product.sizes.find((s) => getVariantStock(product, defaultColor, s) > 0) ??
      product.sizes[0] ??
      '';
    setSelectedSize(firstInStockSize);
    setActiveImageIdx(0);
    setJustAdded(false);
  }, [product, initialColorName]);

  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedColor]);

  useEffect(() => {
    setJustAdded(false);
  }, [selectedColor, selectedSize]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  const activeColor = product
    ? product.colors.find((c) => c.name === selectedColor) ?? product.colors[0]
    : undefined;
  const activeColorImage = activeColor?.previewImage || product?.image || '';

  const galleryImages = useMemo(() => {
    if (!product) return [];
    return getProductGalleryImages(product, activeColorImage);
  }, [product, activeColorImage]);

  if (!product) return null;

  const safeIdx =
    galleryImages.length > 0
      ? Math.min(activeImageIdx, galleryImages.length - 1)
      : 0;
  const currentHeroPhoto = galleryImages[safeIdx] ?? {
    url: activeColorImage,
    label: 'Product View',
  };

  const variantStock = activeColor
    ? getVariantStock(product, activeColor.name, selectedSize)
    : 0;

  const currentVariantInCartQty = activeColor
    ? bagItems
        .filter(
          (i) =>
            i.productId === product.id &&
            i.colorName === activeColor.name &&
            i.size === selectedSize,
        )
        .reduce((sum, i) => sum + i.quantity, 0)
    : 0;

  const effectivePriceInr = getEffectivePriceInr(product);
  const hasProductDiscount =
    (product.discountPercent ?? 0) > 0 && effectivePriceInr < product.priceInr;

  const sizeChart = getSizeChartForCategory(product.category);
  const selectedSizeRow = sizeChart.rows.find((r) => r.size === selectedSize);

  const handleAdd = () => {
    if (!activeColor || !selectedSize || variantStock <= 0) return;
    onAddToBag(
      product,
      activeColor.name,
      activeColor.hex,
      activeColorImage,
      selectedSize,
    );
    setJustAdded(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#1C1917]/60 backdrop-blur-sm p-0 md:p-6 overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={onClose}
    >
      <div
        className="relative w-full md:max-w-5xl max-h-[92vh] md:max-h-[90vh] bg-[#FFFFFF] rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-[#E6DFD3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle & Close Bar */}
        <div className="md:hidden flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#F3EFE8] shrink-0">
          <span className="w-10" aria-hidden="true" />
          <div className="w-10 h-1.5 rounded-full bg-[#D6CFC3]" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close garment details"
            className="w-11 h-11 flex items-center justify-center rounded-full text-[#1C1917] hover:bg-[#F3EFE8] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close garment details"
          className="hidden md:flex absolute top-4 right-4 z-10 w-10 h-10 items-center justify-center rounded-full bg-[#FFFFFF]/95 border border-[#E6DFD3] text-[#1C1917] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12">
          {/* Left Multi-Image Detail Gallery (4–5 Images) */}
          <div className="md:col-span-6 bg-[#FAF8F5] flex flex-col border-b md:border-b-0 md:border-r border-[#E6DFD3]">
            <div className="relative aspect-[4/4] md:aspect-[4/5] w-full bg-[#F3EFE8] overflow-hidden">
              <GarmentImage
                src={currentHeroPhoto.url}
                alt={`${product.name} — ${currentHeroPhoto.label}`}
                accentHex={activeColor?.hex}
                className="w-full h-full object-cover object-top"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous product photo"
                    onClick={() =>
                      setActiveImageIdx(
                        (prev) =>
                          (prev - 1 + galleryImages.length) %
                          galleryImages.length,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-[#E6DFD3] text-[#1C1917] flex items-center justify-center hover:bg-white shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next product photo"
                    onClick={() =>
                      setActiveImageIdx(
                        (prev) => (prev + 1) % galleryImages.length,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-[#E6DFD3] text-[#1C1917] flex items-center justify-center hover:bg-white shadow-sm cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded bg-[#1C1917]/80 text-white text-[11px] font-medium backdrop-blur-xs">
                      {currentHeroPhoto.label}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-white/90 text-[#1C1917] text-[11px] font-bold tabular-nums border border-[#E6DFD3]">
                      {safeIdx + 1} / {galleryImages.length}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* 4–5 Detail Thumbnails Strip */}
            {galleryImages.length > 1 && (
              <div className="p-3 bg-[#FAF8F5] border-t border-[#E6DFD3]">
                <div className="grid grid-cols-5 gap-2">
                  {galleryImages.map((img, idx) => {
                    const isActive = idx === safeIdx;
                    return (
                      <button
                        key={`${img.url}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        aria-label={`View ${img.label}`}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                          isActive
                            ? 'border-[#144534] ring-1 ring-[#144534]'
                            : 'border-[#E6DFD3] opacity-80 hover:opacity-100 hover:border-[#8C6A36]'
                        }`}
                      >
                        <GarmentImage
                          src={img.url}
                          alt={img.label}
                          className="w-full h-full object-cover object-top"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#6B655E]">
                <span className="uppercase tracking-wider">
                  {product.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>Incl. of all GST</span>
              </div>

              <h2
                id="pdp-title"
                className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold text-[#1C1917] leading-tight"
              >
                {product.name}
              </h2>

              <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
                <p className="text-lg font-semibold text-[#144534] tabular-nums">
                  {formatINR(effectivePriceInr)}
                </p>
                {hasProductDiscount && (
                  <>
                    <span className="text-sm text-[#6B655E] line-through tabular-nums">
                      {formatINR(product.priceInr)}
                    </span>
                    <span className="text-xs font-bold text-[#8C6A36] uppercase tracking-wider">
                      {product.discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>

              <p className="mt-3 text-sm text-[#57524C] leading-relaxed">
                {product.description}
              </p>

              {/* Colorway Selector */}
              <div className="mt-6 pt-5 border-t border-[#F3EFE8]">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-medium text-[#1C1917]">
                    Shade:{' '}
                    <span className="text-[#6B655E] font-normal">
                      {activeColor?.name}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const isSelected = color.name === activeColor?.name;
                    const colorQty = getColorStock(product, color.name);
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        className={`min-h-[44px] px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#144534] bg-[#FAF8F5] text-[#144534]'
                            : 'border-[#E6DFD3] bg-white text-[#6B655E] hover:border-[#144534]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="whitespace-nowrap">{color.name}</span>
                        {colorQty === 0 && (
                          <span className="text-[10px] text-[#8C2D2D]">
                            (Sold out)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selector + Proper Original Size Chart */}
              <div className="mt-5">
                <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#1C1917]">
                      Select Size
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSizeChart((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#144534] underline underline-offset-4 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>
                        {showSizeChart ? 'Hide Size Chart' : 'Original Size Chart'}
                      </span>
                    </button>
                  </div>

                  <span
                    className={`tabular-nums font-semibold ${
                      variantStock === 0
                        ? 'text-[#8C2D2D]'
                        : variantStock <= 3
                          ? 'text-[#8C6A36]'
                          : 'text-[#144534]'
                    }`}
                  >
                    {variantStock === 0
                      ? 'Out of stock'
                      : variantStock <= 3
                        ? `Only ${variantStock} left`
                        : 'In Stock'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const qty = activeColor
                      ? getVariantStock(product, activeColor.name, size)
                      : 0;
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-h-[44px] min-w-[54px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer tabular-nums ${
                          isSelected
                            ? 'bg-[#144534] text-white border-[#144534]'
                            : qty === 0
                              ? 'bg-[#FAF8F5] text-[#A8A095] border-[#E6DFD3] line-through'
                              : 'bg-white text-[#1C1917] border-[#E6DFD3] hover:border-[#144534]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Selected Size Measurement Summary */}
                {selectedSizeRow && (
                  <p className="mt-2.5 text-[11px] sm:text-xs font-semibold text-black bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3 py-2 tabular-nums">
                    Size {selectedSizeRow.size}: Chest{' '}
                    {sizeUnit === 'in'
                      ? `${selectedSizeRow.chestIn}"`
                      : `${formatCm(selectedSizeRow.chestIn)} cm`}{' '}
                    · Shoulder{' '}
                    {sizeUnit === 'in'
                      ? `${selectedSizeRow.shoulderIn}"`
                      : `${formatCm(selectedSizeRow.shoulderIn)} cm`}{' '}
                    · Length{' '}
                    {sizeUnit === 'in'
                      ? `${selectedSizeRow.lengthIn}"`
                      : `${formatCm(selectedSizeRow.lengthIn)} cm`}{' '}
                    · {sizeChart.fourthLabel}{' '}
                    {sizeUnit === 'in'
                      ? `${selectedSizeRow.fourthMetricIn}"`
                      : `${formatCm(selectedSizeRow.fourthMetricIn)} cm`}
                  </p>
                )}

                {/* Original Garment Size Chart Table */}
                {showSizeChart && (
                  <div className="mt-3 rounded-xl border border-[#D6CFC3] bg-[#FAF8F5] overflow-hidden">
                    <div className="px-3.5 py-2.5 bg-white border-b border-[#E6DFD3] flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-black">
                        {sizeChart.title}
                      </span>
                      <div className="inline-flex rounded-md border border-[#D6CFC3] overflow-hidden text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setSizeUnit('in')}
                          className={`px-2 py-0.5 cursor-pointer ${
                            sizeUnit === 'in'
                              ? 'bg-[#144534] text-white'
                              : 'bg-white text-black'
                          }`}
                        >
                          Inches
                        </button>
                        <button
                          type="button"
                          onClick={() => setSizeUnit('cm')}
                          className={`px-2 py-0.5 cursor-pointer ${
                            sizeUnit === 'cm'
                              ? 'bg-[#144534] text-white'
                              : 'bg-white text-black'
                          }`}
                        >
                          cm
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px] sm:text-xs tabular-nums">
                        <thead>
                          <tr className="border-b border-[#E6DFD3] text-[#57524C] font-bold">
                            <th className="py-2 px-3">Size</th>
                            <th className="py-2 px-2.5">Chest</th>
                            <th className="py-2 px-2.5">Shoulder</th>
                            <th className="py-2 px-2.5">Length</th>
                            <th className="py-2 px-3">{sizeChart.fourthLabel}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6DFD3]">
                          {sizeChart.rows.map((row) => {
                            const isCurrent = row.size === selectedSize;
                            return (
                              <tr
                                key={row.size}
                                onClick={() => setSelectedSize(row.size)}
                                className={`cursor-pointer transition-colors ${
                                  isCurrent
                                    ? 'bg-[#144534]/10 font-bold text-[#144534]'
                                    : 'text-black hover:bg-white/80'
                                }`}
                              >
                                <td className="py-2 px-3 font-bold">
                                  {row.size}
                                </td>
                                <td className="py-2 px-2.5">
                                  {sizeUnit === 'in'
                                    ? `${row.chestIn}"`
                                    : `${formatCm(row.chestIn)}`}
                                </td>
                                <td className="py-2 px-2.5">
                                  {sizeUnit === 'in'
                                    ? `${row.shoulderIn}"`
                                    : `${formatCm(row.shoulderIn)}`}
                                </td>
                                <td className="py-2 px-2.5">
                                  {sizeUnit === 'in'
                                    ? `${row.lengthIn}"`
                                    : `${formatCm(row.lengthIn)}`}
                                </td>
                                <td className="py-2 px-3">
                                  {sizeUnit === 'in'
                                    ? `${row.fourthMetricIn}"`
                                    : `${formatCm(row.fourthMetricIn)}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Material, Fit & India Delivery */}
              <div className="mt-6 pt-5 border-t border-[#F3EFE8] space-y-2.5 text-xs text-[#6B655E]">
                <div className="flex items-start gap-2">
                  <ShieldCheck
                    className="w-4 h-4 text-[#144534] shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <span>
                    <strong className="text-[#1C1917] font-medium">
                      Fabric:
                    </strong>{' '}
                    {product.fabric}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles
                    className="w-4 h-4 text-[#144534] shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <span>
                    <strong className="text-[#1C1917] font-medium">
                      Fit &amp; Tailoring:
                    </strong>{' '}
                    {product.fitNotes}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Truck
                    className="w-4 h-4 text-[#144534] shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <span>
                    <strong className="text-black font-bold">
                      Delivery &amp; Returns:
                    </strong>{' '}
                    <span className="font-semibold text-black">
                      Free delivery above ₹999 (₹99 otherwise). 5-day returns
                      (delivery charges deducted).
                    </span>
                  </span>
                </div>
              </div>

              {/* 3-Column Trust Badges Strip */}
              <div className="mt-5 pt-4 border-t border-[#F3EFE8] grid grid-cols-3 gap-2 sm:gap-4 text-center">
                {/* 100% Genuine Product */}
                <div className="flex flex-col items-center">
                  <svg
                    viewBox="0 0 48 48"
                    className="w-11 h-11 mb-1.5"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M17.5 31.5V43l6.5-3.5 6.5 3.5V31.5"
                      stroke="#64748B"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M24 6.5l3.1 2.2 3.8-.3 1.4 3.5 3.4 1.6-.2 3.8 2.3 3-1.9 3.3.5 3.8-3.1 2.1-1.1 3.6-3.8.2-2.4 2.9-3.6-1.3-3.6 1.3-2.4-2.9-3.8-.2-1.1-3.6-3.1-2.1.5-3.8-1.9-3.3 2.3-3-.2-3.8 3.4-1.6 1.4-3.5 3.8.3L24 6.5z"
                      fill="#FFFFFF"
                      stroke="#64748B"
                      strokeWidth="1.75"
                      strokeLinejoin="round"
                    />
                    <g transform="rotate(-18 24 21)">
                      <rect
                        x="10.5"
                        y="17"
                        width="27"
                        height="8"
                        rx="1.5"
                        fill="#FACC15"
                      />
                      <text
                        x="24"
                        y="22.8"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="4.9"
                        fontWeight="800"
                        letterSpacing="0.4"
                      >
                        ORIGINAL
                      </text>
                    </g>
                  </svg>
                  <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.05em] uppercase text-[#5E6773] leading-tight">
                    100% Genuine
                    <br />
                    Product
                  </p>
                </div>

                {/* 100% Secure Payment */}
                <div className="flex flex-col items-center">
                  <svg
                    viewBox="0 0 48 48"
                    className="w-11 h-11 mb-1.5"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 10h4.5l3.6 18.5h18.4l2.8-12.5"
                      stroke="#475569"
                      strokeWidth="1.85"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.8 22h17.4"
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="19" cy="34.5" r="2.75" fill="#475569" />
                    <circle cx="32.5" cy="34.5" r="2.75" fill="#475569" />
                    <circle cx="27" cy="17.5" r="8" fill="#FACC15" />
                    <path
                      d="M23.8 17.6l2.1 2.2 4.3-4.3"
                      stroke="#FFFFFF"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.05em] uppercase text-[#5E6773] leading-tight">
                    100% Secure
                    <br />
                    Payment
                  </p>
                </div>

                {/* Easy Returns & Instant Refunds */}
                <div className="flex flex-col items-center">
                  <svg
                    viewBox="0 0 48 48"
                    className="w-11 h-11 mb-1.5"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12.5 14.5A14 14 0 0 1 35 13.5"
                      stroke="#475569"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                    <path
                      d="M32.5 14l3.3-.2-.7-3.2"
                      stroke="#475569"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M35.5 31.5A14 14 0 0 1 13 32.5"
                      stroke="#475569"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15.5 32l-3.3.2.7 3.2"
                      stroke="#475569"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M24 15.5l8.5 4.2v9.1L24 33l-8.5-4.2v-9.1L24 15.5z"
                      fill="#FFFFFF"
                      stroke="#475569"
                      strokeWidth="1.65"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.5 19.7L24 23.8l8.5-4.1M24 23.8V33"
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19.8 17.6l8.4 4.1"
                      stroke="#FACC15"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <rect
                      x="17.5"
                      y="23.5"
                      width="4"
                      height="2.5"
                      rx="0.5"
                      fill="#FACC15"
                    />
                  </svg>
                  <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.05em] uppercase text-[#5E6773] leading-tight">
                    Easy Returns &amp;
                    <br />
                    Instant Refunds
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Bottom Action Bar (Always Visible on Mobile & Desktop) */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-[#FFFFFF] border-t border-[#E6DFD3] pb-safe shrink-0">
          {justAdded || currentVariantInCartQty > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#144534]">
                <Check className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                <span>
                  In cart ({currentVariantInCartQty} · Size {selectedSize})
                </span>
              </div>
              <div className="flex flex-1 sm:flex-initial items-center gap-2.5 sm:ml-auto">
                <button
                  type="button"
                  disabled={
                    variantStock <= 0 || currentVariantInCartQty >= variantStock
                  }
                  onClick={handleAdd}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-[#144534] bg-white text-[#144534] text-xs sm:text-sm font-semibold hover:bg-[#FAF8F5] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {currentVariantInCartQty >= variantStock
                    ? 'Max Stock'
                    : 'Add +1'}
                </button>
                <button
                  type="button"
                  onClick={onGoToCart}
                  className="flex-1 sm:flex-initial sm:min-w-[210px] min-h-[46px] px-5 py-2.5 rounded-xl bg-[#144534] text-white text-sm font-semibold hover:bg-[#0E3427] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Go to Cart ({bagCount})</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={variantStock <= 0}
                onClick={handleAdd}
                className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#144534] text-white text-sm font-semibold hover:bg-[#0E3427] disabled:bg-[#E6DFD3] disabled:text-[#6B655E] disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {variantStock <= 0 ? (
                  <span>Sold Out in {selectedSize}</span>
                ) : (
                  <span>
                    Add to Cart ({selectedSize}) — {formatINR(effectivePriceInr)}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onGoToCart}
                className="min-h-[46px] px-4 py-2.5 rounded-xl border border-[#144534] bg-white text-[#144534] text-xs sm:text-sm font-semibold hover:bg-[#FAF8F5] transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Cart ({bagCount})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
