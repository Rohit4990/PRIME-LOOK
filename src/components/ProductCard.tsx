import { useState } from 'react';
import {
  formatINR,
  getColorStock,
  getEffectivePriceInr,
} from '../data/catalog';
import { Product } from '../types';
import { GarmentImage } from './GarmentImage';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product, colorName: string) => void;
}

export function ProductCard({ product, onSelectProduct }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0]?.name ?? '',
  );

  const activeColorObj =
    product.colors.find((c) => c.name === selectedColor) ?? product.colors[0];

  const activeImage = activeColorObj?.previewImage || product.image;

  const colorStock = activeColorObj
    ? getColorStock(product, activeColorObj.name)
    : 0;

  const stockLabel =
    colorStock === 0
      ? 'Sold Out'
      : colorStock <= 6
        ? `Only ${colorStock} left`
        : 'In Stock';

  return (
    <article className="group flex flex-col bg-[#FFFFFF] border border-[#E6DFD3] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Model Lookbook Portrait Container */}
      <button
        type="button"
        onClick={() =>
            onSelectProduct(
              product,
              activeColorObj?.name ?? product.colors[0]?.name ?? '',
            )
        }
        className="relative aspect-[3/4] w-full bg-[#F3EFE8] overflow-hidden text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#144534]"
        aria-label={`View ${product.name} in ${activeColorObj?.name}`}
      >
        <GarmentImage
          src={activeImage}
          alt={`${product.name} — ${activeColorObj?.name ?? ''}`}
          accentHex={activeColorObj?.hex}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      {/* Card Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          {/* Unboxed Metadata Line */}
          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-[#6B655E]">
            <span className="uppercase tracking-wider truncate">
              {product.category}
            </span>
            <span className="whitespace-nowrap tabular-nums">
              {product.colors.length} Shades
            </span>
          </div>

          {/* Product Title */}
          <button
            type="button"
            onClick={() =>
              onSelectProduct(
                product,
                activeColorObj?.name ?? product.colors[0]?.name ?? '',
              )
            }
            className="mt-1 text-left w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-[#144534]"
          >
            <h3 className="text-sm sm:text-base font-semibold text-[#1C1917] leading-snug line-clamp-2 group-hover:text-[#144534] transition-colors">
              {product.name}
            </h3>
          </button>

          {/* Interactive Color Swatches */}
          <div className="mt-2.5 flex items-center flex-wrap gap-0.5">
            {product.colors.map((color) => {
              const isSelected = color.name === activeColorObj?.name;
              return (
                <button
                  key={color.name}
                  type="button"
                  title={`${color.name}`}
                  aria-label={`Select shade ${color.name}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedColor(color.name)}
                  className="w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#144534]"
                >
                  <span
                    className={`w-4 h-4 rounded-full transition-transform ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-[#144534] scale-110'
                        : 'ring-1 ring-black/20 hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              );
            })}
            <span className="ml-1 text-[11px] sm:text-xs text-[#6B655E] truncate max-w-[96px]">
              {activeColorObj?.name}
            </span>
          </div>
        </div>

        {/* Baseline Price + Stock Status */}
        <div className="pt-2.5 border-t border-[#F3EFE8] flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-[15px] font-semibold text-[#1C1917] tabular-nums">
              {formatINR(getEffectivePriceInr(product))}
            </span>
            {(product.discountPercent ?? 0) > 0 && (
              <>
                <span className="text-[11px] text-[#6B655E] line-through tabular-nums">
                  {formatINR(product.priceInr)}
                </span>
                <span className="text-[10px] font-bold text-[#144534] uppercase">
                  {product.discountPercent}% OFF
                </span>
              </>
            )}
          </div>
          <span
            className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${
              colorStock === 0
                ? 'text-[#8C2D2D]'
                : colorStock <= 6
                  ? 'text-[#8C6A36]'
                  : 'text-[#144534]'
            }`}
          >
            {stockLabel}
          </span>
        </div>
      </div>
    </article>
  );
}
