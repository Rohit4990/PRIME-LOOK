export type ProductCategory = 'Shirts' | 'T-Shirts' | 'Polo T-Shirts';

export type ColorFamily =
  | 'All'
  | 'Ivory & Sand'
  | 'Emerald & Olive'
  | 'Burgundy Wine'
  | 'Camel & Espresso'
  | 'Obsidian Black';

export interface GarmentColor {
  name: string;
  hex: string;
  family: Exclude<ColorFamily, 'All'>;
  previewImage?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  priceInr: number;
  discountPercent?: number;
  image: string;
  galleryImages?: string[];
  description: string;
  fabric: string;
  origin: string;
  fitNotes: string;
  sizes: string[];
  colors: GarmentColor[];
  stock: Record<string, Record<string, number>>;
  featured?: boolean;
}

export interface BagItem {
  productId: string;
  colorName: string;
  colorHex: string;
  previewImage: string;
  size: string;
  quantity: number;
}

export type IndianPaymentMethod =
  | 'UPI (GPay / PhonePe)'
  | 'Credit / Debit Card'
  | 'NetBanking'
  | 'Cash on Delivery (COD)';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderReceipt {
  id?: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pinCode: string;
  paymentMethod: IndianPaymentMethod;
  items: Array<{
    name: string;
    colorName: string;
    size: string;
    quantity: number;
    priceInr: number;
  }>;
  subtotalInr: number;
  discountInr?: number;
  discountCode?: string;
  shippingInr: number;
  totalInr: number;
  estimatedDelivery: string;
  status?: OrderStatus;
  createdAtMs?: number;
}

export interface StorefrontSettings {
  logoDataUrl: string | null;
  showWordmark: boolean;
  brandName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  showrooms: string;
  hours: string;
  freeShippingAboveInr: number;
  shippingChargeInr: number;
  returnWindowDays: number;
  deliveryDaysText: string;
  returnDeductionText: string;
  discountEnabled?: boolean;
  discountTitle?: string;
  discountType?: 'percent' | 'flat';
  discountValue?: number;
  discountCode?: string;
  discountMinOrderInr?: number;
}

export interface CustomerVisit {
  id: string;
  visitorId: string;
  isReturning: boolean;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  browser: string;
  referrer: string;
  landingPath: string;
  screenSize: string;
  createdAtMs?: number;
}
