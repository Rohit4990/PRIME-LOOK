import detailKnitWeaveImg from '../assets/images/detail_knit_weave_1794762344521.jpg';
import detailShirtStitchingImg from '../assets/images/detail_shirt_stitching_1794762345235.jpg';
import craftFabricsImg from '../assets/images/india_craft_fabrics_1794742945956.jpg';
import studioShirtBurgundyImg from '../assets/images/india_shirt_burgundy_oxford_1794742946488.jpg';
import studioShirtEmeraldImg from '../assets/images/india_shirt_emerald_linen_1794742946790.jpg';
import studioShirtMandarinImg from '../assets/images/india_shirt_indigo_bandhgala_1794742946220.jpg';
import studioShirtIvoryImg from '../assets/images/india_shirt_ivory_giza_1794742946131.jpg';
import studioTeeObsidianImg from '../assets/images/india_tee_obsidian_supima_1794742947051.jpg';
import studioTeeSandImg from '../assets/images/india_tee_sand_mercerized_1794742948343.jpg';
import studioPoloNavyImg from '../assets/images/mens_polo_merino_navy_1794742334748.jpg';
import studioShirtCampEspressoImg from '../assets/images/mens_shirt_camp_espresso_1794742333771.jpg';
import studioShirtOliveLinenImg from '../assets/images/mens_shirt_linen_olive_1794742331868.jpg';
import studioShirtWhitePoplinImg from '../assets/images/mens_shirt_poplin_white_1794742330649.jpg';
import studioTeeEmeraldImg from '../assets/images/mens_tee_mercerized_emerald_1794742333573.jpg';
import studioTeeObsidianFlatImg from '../assets/images/mens_tee_supima_obsidian_1794742332859.jpg';
import craftFoldedShirtsImg from '../assets/images/menswear_craft_atelier_1794742330376.jpg';
import poloEspressoImg from '../assets/images/model_polo_espresso_knit_1794743880390.jpg';
import shirtBurgundyImg from '../assets/images/model_shirt_burgundy_oxford_1794743878363.jpg';
import shirtCamelImg from '../assets/images/model_shirt_camel_camp_1794743879980.jpg';
import shirtEmeraldImg from '../assets/images/model_shirt_emerald_linen_1794743878426.jpg';
import shirtIvoryImg from '../assets/images/model_shirt_ivory_poplin_1794743878413.jpg';
import shirtOliveMandarinImg from '../assets/images/model_shirt_olive_mandarin_1794743878750.jpg';
import teeForestImg from '../assets/images/model_tee_forest_mercerized_1794743879630.jpg';
import teeObsidianImg from '../assets/images/model_tee_obsidian_supima_1794743879473.jpg';
import heroModelImg from '../assets/images/primelook_hero_model_1794743876753.jpg';
import { ColorFamily, GarmentColor, Product, ProductCategory } from '../types';

export const HERO_INDIA_IMAGE = heroModelImg;

const IMG = {
  shirtIvory: shirtIvoryImg,
  shirtOliveMandarin: shirtOliveMandarinImg,
  shirtEmerald: shirtEmeraldImg,
  shirtBurgundy: shirtBurgundyImg,
  shirtCamel: shirtCamelImg,
  teeObsidian: teeObsidianImg,
  teeForest: teeForestImg,
  poloEspresso: poloEspressoImg,
};

const ASSET_STEMS: Array<[string, string]> = [
  ['primelook_hero_model_1794743876753', heroModelImg],
  ['model_shirt_ivory_poplin_1794743878413', shirtIvoryImg],
  ['model_shirt_olive_mandarin_1794743878750', shirtOliveMandarinImg],
  ['model_shirt_emerald_linen_1794743878426', shirtEmeraldImg],
  ['model_shirt_burgundy_oxford_1794743878363', shirtBurgundyImg],
  ['model_shirt_camel_camp_1794743879980', shirtCamelImg],
  ['model_tee_obsidian_supima_1794743879473', teeObsidianImg],
  ['model_tee_forest_mercerized_1794743879630', teeForestImg],
  ['model_polo_espresso_knit_1794743880390', poloEspressoImg],
  ['india_shirt_ivory_giza_1794742946131', studioShirtIvoryImg],
  ['india_shirt_indigo_bandhgala_1794742946220', studioShirtMandarinImg],
  ['india_shirt_emerald_linen_1794742946790', studioShirtEmeraldImg],
  ['india_shirt_burgundy_oxford_1794742946488', studioShirtBurgundyImg],
  ['mens_shirt_poplin_white_1794742330649', studioShirtWhitePoplinImg],
  ['mens_shirt_linen_olive_1794742331868', studioShirtOliveLinenImg],
  ['mens_shirt_camp_espresso_1794742333771', studioShirtCampEspressoImg],
  ['india_tee_obsidian_supima_1794742947051', studioTeeObsidianImg],
  ['india_tee_sand_mercerized_1794742948343', studioTeeSandImg],
  ['mens_tee_mercerized_emerald_1794742333573', studioTeeEmeraldImg],
  ['mens_tee_supima_obsidian_1794742332859', studioTeeObsidianFlatImg],
  ['mens_polo_merino_navy_1794742334748', studioPoloNavyImg],
  ['india_craft_fabrics_1794742945956', craftFabricsImg],
  ['menswear_craft_atelier_1794742330376', craftFoldedShirtsImg],
  ['detail_shirt_stitching_1794762345235', detailShirtStitchingImg],
  ['detail_knit_weave_1794762344521', detailKnitWeaveImg],
];

export function resolveCatalogAssetUrl(url: string): string {
  if (!url) return url;
  if (
    url.startsWith('data:') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }
  for (const [stem, bundledUrl] of ASSET_STEMS) {
    if (url.includes(stem)) {
      return bundledUrl;
    }
  }
  return url;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getEffectivePriceInr(product: Product): number {
  const pct = product.discountPercent ?? 0;
  if (!Number.isFinite(pct) || pct <= 0) return product.priceInr;
  const clamped = Math.min(90, Math.max(0, pct));
  return Math.max(1, Math.round(product.priceInr * (1 - clamped / 100)));
}

export const CATEGORIES: Array<'All' | ProductCategory> = [
  'All',
  'Shirts',
  'T-Shirts',
  'Polo T-Shirts',
];

export const COLOR_FILTERS: Array<{
  family: ColorFamily;
  swatchHex: string;
}> = [
  {
    family: 'All',
    swatchHex:
      'conic-gradient(#1C1917, #144534, #6B2130, #C7A373, #F4EFE4, #556247)',
  },
  { family: 'Ivory & Sand', swatchHex: '#EFE8DA' },
  { family: 'Emerald & Olive', swatchHex: '#144534' },
  { family: 'Burgundy Wine', swatchHex: '#6B2130' },
  { family: 'Camel & Espresso', swatchHex: '#B68A5A' },
  { family: 'Obsidian Black', swatchHex: '#1C1917' },
];

export interface SizeMeasurementRow {
  size: string;
  chestIn: number;
  shoulderIn: number;
  lengthIn: number;
  fourthMetricIn: number; // Collar for Shirts, Sleeve for Tees & Polos
}

export const SHIRT_SIZE_CHART: SizeMeasurementRow[] = [
  { size: '38 (S)', chestIn: 40.0, shoulderIn: 17.2, lengthIn: 28.5, fourthMetricIn: 15.0 },
  { size: '40 (M)', chestIn: 42.0, shoulderIn: 18.0, lengthIn: 29.2, fourthMetricIn: 15.7 },
  { size: '42 (L)', chestIn: 44.0, shoulderIn: 18.7, lengthIn: 30.0, fourthMetricIn: 16.5 },
  { size: '44 (XL)', chestIn: 46.5, shoulderIn: 19.5, lengthIn: 30.7, fourthMetricIn: 17.3 },
  { size: '46 (XXL)', chestIn: 49.0, shoulderIn: 20.2, lengthIn: 31.5, fourthMetricIn: 18.1 },
];

export const TEE_POLO_SIZE_CHART: SizeMeasurementRow[] = [
  { size: 'S', chestIn: 39.0, shoulderIn: 17.0, lengthIn: 27.0, fourthMetricIn: 8.2 },
  { size: 'M', chestIn: 41.0, shoulderIn: 17.7, lengthIn: 28.0, fourthMetricIn: 8.6 },
  { size: 'L', chestIn: 43.0, shoulderIn: 18.5, lengthIn: 29.0, fourthMetricIn: 9.0 },
  { size: 'XL', chestIn: 45.5, shoulderIn: 19.2, lengthIn: 29.8, fourthMetricIn: 9.4 },
  { size: 'XXL', chestIn: 48.0, shoulderIn: 20.0, lengthIn: 30.5, fourthMetricIn: 9.8 },
];

export function getSizeChartForCategory(category: ProductCategory): {
  title: string;
  fourthLabel: string;
  rows: SizeMeasurementRow[];
} {
  if (category === 'Shirts') {
    return {
      title: "Original Men's Shirt Size Chart",
      fourthLabel: 'Collar',
      rows: SHIRT_SIZE_CHART,
    };
  }
  return {
    title:
      category === 'Polo T-Shirts'
        ? "Original Men's Polo Size Chart"
        : "Original Men's T-Shirt Size Chart",
    fourthLabel: 'Sleeve',
    rows: TEE_POLO_SIZE_CHART,
  };
}

export const ATELIER_PALETTE: Record<string, GarmentColor> = {
  ivoryGiza: {
    name: 'Ivory Giza',
    hex: '#F4EFE4',
    family: 'Ivory & Sand',
    previewImage: IMG.shirtIvory,
  },
  sageOlive: {
    name: 'Sage Olive',
    hex: '#556247',
    family: 'Emerald & Olive',
    previewImage: IMG.shirtOliveMandarin,
  },
  forestEmerald: {
    name: 'Forest Emerald',
    hex: '#144534',
    family: 'Emerald & Olive',
    previewImage: IMG.shirtEmerald,
  },
  pineMercerized: {
    name: 'Pine Emerald',
    hex: '#1E4D3B',
    family: 'Emerald & Olive',
    previewImage: IMG.teeForest,
  },
  burgundyWine: {
    name: 'Burgundy Wine',
    hex: '#6B2130',
    family: 'Burgundy Wine',
    previewImage: IMG.shirtBurgundy,
  },
  camelSand: {
    name: 'Camel Sand',
    hex: '#C49A6C',
    family: 'Camel & Espresso',
    previewImage: IMG.shirtCamel,
  },
  richEspresso: {
    name: 'Rich Espresso',
    hex: '#3F2A22',
    family: 'Camel & Espresso',
    previewImage: IMG.poloEspresso,
  },
  obsidianBlack: {
    name: 'Obsidian Black',
    hex: '#1C1917',
    family: 'Obsidian Black',
    previewImage: IMG.teeObsidian,
  },
};

function buildStock(
  colors: GarmentColor[],
  sizes: string[],
  pattern: number[],
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  colors.forEach((c, ci) => {
    matrix[c.name] = {};
    sizes.forEach((s, si) => {
      matrix[c.name][s] = pattern[(ci + si) % pattern.length];
    });
  });
  return matrix;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'pl-in-01',
    sku: 'PL-IN-101',
    name: 'Giza 45 Poplin Dress Shirt',
    category: 'Shirts',
    priceInr: 4990,
    image: IMG.shirtIvory,
    galleryImages: [
      IMG.shirtIvory,
      studioShirtIvoryImg,
      studioShirtWhitePoplinImg,
      detailShirtStitchingImg,
      craftFoldedShirtsImg,
    ],
    description:
      'Cut from two-fold Giza 45 long-staple cotton poplin with a structured cutaway collar, 22-stitches-per-inch French seams, and genuine mother-of-pearl buttons.',
    fabric: '100% Two-Fold Giza 45 Cotton (120/2)',
    origin: '22-SPI French Seams · Mother-of-Pearl Buttons',
    fitNotes: 'Tailored architectural cut; breathable all-day drape.',
    sizes: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
    colors: [
      ATELIER_PALETTE.ivoryGiza,
      ATELIER_PALETTE.forestEmerald,
      ATELIER_PALETTE.burgundyWine,
      ATELIER_PALETTE.sageOlive,
      ATELIER_PALETTE.camelSand,
    ],
    stock: buildStock(
      [
        ATELIER_PALETTE.ivoryGiza,
        ATELIER_PALETTE.forestEmerald,
        ATELIER_PALETTE.burgundyWine,
        ATELIER_PALETTE.sageOlive,
        ATELIER_PALETTE.camelSand,
      ],
      ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
      [8, 12, 10, 6, 4, 7, 9, 5, 2, 6],
    ),
    featured: true,
  },
  {
    id: 'pl-in-02',
    sku: 'PL-IN-104',
    name: 'Bandhgala Mandarin Collar Shirt',
    category: 'Shirts',
    priceInr: 5490,
    image: IMG.shirtOliveMandarin,
    galleryImages: [
      IMG.shirtOliveMandarin,
      studioShirtMandarinImg,
      studioShirtOliveLinenImg,
      detailShirtStitchingImg,
      craftFabricsImg,
    ],
    description:
      'Contemporary mandarin-collar shirt tailored in crisp cotton-linen weave with a concealed button placket — crafted to wear solo at evening gatherings or beneath a jacket.',
    fabric: '68% Giza Cotton, 32% Fine Flax Linen',
    origin: 'Concealed Placket · Stand Collar',
    fitNotes: 'Clean structured stand collar; tapered waist.',
    sizes: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
    colors: [
      ATELIER_PALETTE.sageOlive,
      ATELIER_PALETTE.ivoryGiza,
      ATELIER_PALETTE.forestEmerald,
      ATELIER_PALETTE.burgundyWine,
    ],
    stock: buildStock(
      [
        ATELIER_PALETTE.sageOlive,
        ATELIER_PALETTE.ivoryGiza,
        ATELIER_PALETTE.forestEmerald,
        ATELIER_PALETTE.burgundyWine,
      ],
      ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
      [6, 10, 9, 5, 3, 7, 8, 4, 2, 6],
    ),
    featured: true,
  },
  {
    id: 'pl-in-03',
    sku: 'PL-IN-108',
    name: 'Pure Flax Linen Resort Shirt',
    category: 'Shirts',
    priceInr: 4790,
    image: IMG.shirtEmerald,
    galleryImages: [
      IMG.shirtEmerald,
      studioShirtEmeraldImg,
      studioShirtOliveLinenImg,
      detailShirtStitchingImg,
      craftFabricsImg,
    ],
    description:
      'Enzyme-washed long-staple flax linen tailored for warm weather with breathable open-weave structure and natural horn buttons.',
    fabric: '100% Pure Flax Linen (175 gsm)',
    origin: 'Enzyme-Washed Linen · Horn Buttons',
    fitNotes: 'Relaxed smart fit; sleeves roll cleanly above the elbow.',
    sizes: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
    colors: [
      ATELIER_PALETTE.forestEmerald,
      ATELIER_PALETTE.ivoryGiza,
      ATELIER_PALETTE.camelSand,
      ATELIER_PALETTE.sageOlive,
      ATELIER_PALETTE.burgundyWine,
    ],
    stock: buildStock(
      [
        ATELIER_PALETTE.forestEmerald,
        ATELIER_PALETTE.ivoryGiza,
        ATELIER_PALETTE.camelSand,
        ATELIER_PALETTE.sageOlive,
        ATELIER_PALETTE.burgundyWine,
      ],
      ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
      [5, 9, 11, 6, 4, 7, 8, 3, 5, 6],
    ),
    featured: true,
  },
  {
    id: 'pl-in-04',
    sku: 'PL-IN-112',
    name: 'Brushed Oxford Button-Down Shirt',
    category: 'Shirts',
    priceInr: 4490,
    image: IMG.shirtBurgundy,
    galleryImages: [
      IMG.shirtBurgundy,
      studioShirtBurgundyImg,
      studioShirtIvoryImg,
      detailShirtStitchingImg,
      craftFoldedShirtsImg,
    ],
    description:
      'Substantial basket-weave Oxford cloth lightly peached for velvet softness, finished with a classic S-roll button-down collar and gusseted side seams.',
    fabric: '100% Long-Staple Combed Oxford Cotton',
    origin: 'Peached Basket-Weave · S-Roll Collar',
    fitNotes: 'Smart-casual tailored cut; ideal tucked or untucked.',
    sizes: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
    colors: [
      ATELIER_PALETTE.burgundyWine,
      ATELIER_PALETTE.ivoryGiza,
      ATELIER_PALETTE.forestEmerald,
      ATELIER_PALETTE.camelSand,
    ],
    stock: buildStock(
      [
        ATELIER_PALETTE.burgundyWine,
        ATELIER_PALETTE.ivoryGiza,
        ATELIER_PALETTE.forestEmerald,
        ATELIER_PALETTE.camelSand,
      ],
      ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
      [6, 11, 8, 7, 3, 5, 9, 4, 6, 5],
    ),
    featured: true,
  },
  {
    id: 'pl-in-05',
    sku: 'PL-IN-116',
    name: 'Camel Sand Camp-Collar Shirt',
    category: 'Shirts',
    priceInr: 4290,
    image: IMG.shirtCamel,
    galleryImages: [
      IMG.shirtCamel,
      studioShirtCampEspressoImg,
      studioShirtOliveLinenImg,
      detailShirtStitchingImg,
      craftFabricsImg,
    ],
    description:
      'Warm camel sand resort shirt cut with a relaxed open Cuban camp collar, straight hem, and breathable cotton-linen slub texture.',
    fabric: '60% Flax Linen, 40% Giza Cotton',
    origin: 'Open Cuban Collar · Straight Hem',
    fitNotes: 'Effortless summer drape; wear solo or layered over a white tee.',
    sizes: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
    colors: [
      ATELIER_PALETTE.camelSand,
      ATELIER_PALETTE.ivoryGiza,
      ATELIER_PALETTE.sageOlive,
      ATELIER_PALETTE.forestEmerald,
    ],
    stock: buildStock(
      [
        ATELIER_PALETTE.camelSand,
        ATELIER_PALETTE.ivoryGiza,
        ATELIER_PALETTE.sageOlive,
        ATELIER_PALETTE.forestEmerald,
      ],
      ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
      [7, 12, 10, 6, 4, 8, 9, 5, 3, 7],
    ),
  },
  {
    id: 'pl-in-06',
    sku: 'PL-IN-201',
    name: '260gsm Obsidian Supima Crewneck Tee',
    category: 'T-Shirts',
    priceInr: 2290,
    image: IMG.teeObsidian,
    galleryImages: [
      IMG.teeObsidian,
      studioTeeObsidianImg,
      studioTeeObsidianFlatImg,
      studioTeeSandImg,
      detailKnitWeaveImg,
    ],
    description:
      'Heavyweight architectural men’s t-shirt knitted from extra-long-staple Supima cotton with a double-ribbed bound collar that stays crisp wash after wash.',
    fabric: '100% 260gsm Heavyweight Supima Cotton',
    origin: 'Double-Ribbed Bound Collar · Pre-Shrunk',
    fitNotes: 'Structured shoulder line; opaque matte finish.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      ATELIER_PALETTE.obsidianBlack,
      ATELIER_PALETTE.pineMercerized,
      ATELIER_PALETTE.richEspresso,
      ATELIER_PALETTE.camelSand,
    ],
    stock: buildStock(
      [
        ATELIER_PALETTE.obsidianBlack,
        ATELIER_PALETTE.pineMercerized,
        ATELIER_PALETTE.richEspresso,
        ATELIER_PALETTE.camelSand,
      ],
      ['S', 'M', 'L', 'XL', 'XXL'],
      [12, 16, 14, 9, 6, 10, 8, 11, 5, 7],
    ),
    featured: true,
  },
  {
    id: 'pl-in-07',
    sku: 'PL-IN-205',
    name: 'Filo di Scozia Pine Mercerized Tee',
    category: 'T-Shirts',
    priceInr: 2690,
    image: IMG.teeForest,
    galleryImages: [
      IMG.teeForest,
      studioTeeEmeraldImg,
      studioTeeSandImg,
      studioTeeObsidianImg,
      detailKnitWeaveImg,
    ],
    description:
      'Double-mercerized luxury cotton jersey offering a cool, silk-like luster suited to humid weather, zero pilling, and deep emerald color fastness.',
    fabric: '100% Double-Mercerized Filo di Scozia Cotton',
    origin: 'Zero-Pilling Double Mercerized Finish',
    fitNotes: 'Clean tailored drape; ideal solo or beneath blazers.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      ATELIER_PALETTE.pineMercerized,
      ATELIER_PALETTE.obsidianBlack,
      ATELIER_PALETTE.richEspresso,
      ATELIER_PALETTE.camelSand,
    ],
    stock: buildStock(
      [
        ATELIER_PALETTE.pineMercerized,
        ATELIER_PALETTE.obsidianBlack,
        ATELIER_PALETTE.richEspresso,
        ATELIER_PALETTE.camelSand,
      ],
      ['S', 'M', 'L', 'XL', 'XXL'],
      [9, 14, 12, 8, 5, 11, 7, 10, 4, 8],
    ),
    featured: true,
  },
  {
    id: 'pl-in-08',
    sku: 'PL-IN-301',
    name: 'Sovereign Merino-Silk Johnny Polo',
    category: 'Polo T-Shirts',
    priceInr: 3990,
    image: IMG.poloEspresso,
    galleryImages: [
      IMG.poloEspresso,
      studioPoloNavyImg,
      studioTeeSandImg,
      detailKnitWeaveImg,
      craftFabricsImg,
    ],
    description:
      'Fine 18-gauge knitted polo blending breathable mulberry silk and extrafine merino in rich espresso with an effortless open Riviera collar and ribbed waist.',
    fabric: '70% Extrafine Merino, 30% Mulberry Silk',
    origin: '18-Gauge Full-Fashioned Knit · Riviera Collar',
    fitNotes: 'Refined tailored fit; sits cleanly at the trouser line.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      ATELIER_PALETTE.richEspresso,
      ATELIER_PALETTE.obsidianBlack,
      ATELIER_PALETTE.pineMercerized,
      ATELIER_PALETTE.burgundyWine,
    ],
    stock: buildStock(
      [
        ATELIER_PALETTE.richEspresso,
        ATELIER_PALETTE.obsidianBlack,
        ATELIER_PALETTE.pineMercerized,
        ATELIER_PALETTE.burgundyWine,
      ],
      ['S', 'M', 'L', 'XL', 'XXL'],
      [6, 10, 9, 5, 3, 8, 7, 4, 2, 6],
    ),
    featured: true,
  },
];

export function getProductGalleryImages(
  product: Product,
  activeColorImage: string,
): Array<{ url: string; label: string }> {
  const seen = new Set<string>();
  const result: Array<{ url: string; label: string }> = [];

  const pushUnique = (rawUrl: string | undefined, label: string) => {
    if (!rawUrl) return;
    const resolved = resolveCatalogAssetUrl(rawUrl);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    result.push({ url: resolved, label });
  };

  pushUnique(activeColorImage, 'Model View');
  pushUnique(product.image, 'Primary View');

  if (product.galleryImages && product.galleryImages.length > 0) {
    product.galleryImages.forEach((img, idx) => {
      const labels = [
        'Model Look',
        'Studio Front',
        'Alternate View',
        'Stitching & Fabric',
        'Folded Detail',
      ];
      pushUnique(img, labels[idx] ?? `Detail ${idx + 1}`);
    });
  }

  // Fallback enrichment if a Firestore item was created with fewer than 5 images
  if (result.length < 5) {
    product.colors.forEach((c) => {
      if (result.length < 5) {
        pushUnique(c.previewImage, c.name);
      }
    });
  }

  if (result.length < 5) {
    if (product.category === 'Shirts') {
      pushUnique(studioShirtIvoryImg, 'Studio Cut');
      pushUnique(detailShirtStitchingImg, 'Collar & Cuff Detail');
      pushUnique(craftFoldedShirtsImg, 'Folded Craft');
    } else if (product.category === 'Polo T-Shirts') {
      pushUnique(studioPoloNavyImg, 'Knit Placket View');
      pushUnique(detailKnitWeaveImg, 'Knit Texture');
      pushUnique(craftFabricsImg, 'Natural Fiber Swatches');
    } else {
      pushUnique(studioTeeObsidianImg, 'Studio Crewneck');
      pushUnique(studioTeeSandImg, 'Drape & Hem');
      pushUnique(detailKnitWeaveImg, '260gsm Collar & Knit');
    }
  }

  return result.slice(0, 5);
}

export function getColorStock(product: Product, colorName: string): number {
  const sizeMap = product?.stock?.[colorName];
  if (!sizeMap || typeof sizeMap !== 'object') return 0;
  return Object.values(sizeMap).reduce(
    (sum, qty) => sum + (typeof qty === 'number' && Number.isFinite(qty) ? qty : 0),
    0,
  );
}

export function getVariantStock(
  product: Product,
  colorName: string,
  size: string,
): number {
  const qty = product?.stock?.[colorName]?.[size];
  return typeof qty === 'number' && Number.isFinite(qty) ? qty : 0;
}
