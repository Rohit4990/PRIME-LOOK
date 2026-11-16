import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { INITIAL_PRODUCTS, resolveCatalogAssetUrl } from '../data/catalog';
import {
  OperationType,
  db,
  handleFirestoreError,
} from '../firebase';
import {
  CustomerVisit,
  OrderReceipt,
  OrderStatus,
  Product,
  StorefrontSettings,
} from '../types';

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  logoDataUrl: null,
  showWordmark: true,
  brandName: 'Prime Look',
  tagline: 'Menswear India',
  phone: '+91 22 4890 7120',
  email: 'concierge@primelook.in',
  address: '42 Rope Walk Lane, Kala Ghoda, Fort, Mumbai 400001',
  showrooms:
    'Mumbai (Kala Ghoda) · New Delhi (Mehrauli) · Bengaluru (100ft Rd, Indiranagar)',
  hours: 'Mon – Sat · 10:00 AM to 7:30 PM IST',
  freeShippingAboveInr: 999,
  shippingChargeInr: 99,
  returnWindowDays: 5,
  deliveryDaysText: 'Delivered across India in 4–6 days.',
  returnDeductionText:
    'On item returns, ₹99 delivery charges will be deducted from the refund amount.',
  discountEnabled: false,
  discountTitle: 'Festive Customer Offer',
  discountType: 'percent',
  discountValue: 10,
  discountCode: '',
  discountMinOrderInr: 0,
};

function sanitizeProductId(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (cleaned || `pl-${Date.now()}`).slice(0, 128);
}

function sanitizeProductPayload(product: Product) {
  const cleanId = sanitizeProductId(product.id);
  const safeSizes =
    product.sizes.length > 0 ? product.sizes.slice(0, 12) : ['S', 'M', 'L'];
  const safeColors =
    product.colors.length > 0
      ? product.colors.slice(0, 12).map((c) => ({
          name: c.name.slice(0, 60),
          hex: c.hex.slice(0, 20),
          family: c.family,
          ...(c.previewImage ? { previewImage: c.previewImage.slice(0, 400000) } : {}),
        }))
      : [
          {
            name: 'Classic Ivory',
            hex: '#F4EFE4',
            family: 'Ivory & Sand' as const,
            previewImage: product.image.slice(0, 400000),
          },
        ];

  const safeGallery = Array.isArray(product.galleryImages)
    ? product.galleryImages
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .slice(0, 6)
        .map((url) => url.slice(0, 440000))
    : undefined;

  const safeDiscount = Math.max(
    0,
    Math.min(90, Math.round(product.discountPercent ?? 0)),
  );

  return {
    id: cleanId,
    sku: (product.sku || `PL-${Date.now().toString().slice(-4)}`).slice(0, 40),
    name: product.name.trim().slice(0, 160),
    category: product.category,
    priceInr: Math.max(1, Math.min(1000000, Math.round(product.priceInr))),
    ...(safeDiscount > 0 ? { discountPercent: safeDiscount } : {}),
    image: product.image.slice(0, 440000),
    ...(safeGallery && safeGallery.length > 0
      ? { galleryImages: safeGallery }
      : {}),
    description: product.description.trim().slice(0, 1200) || 'Tailored menswear piece.',
    fabric: product.fabric.trim().slice(0, 200) || '100% Pure Cotton',
    origin: product.origin.trim().slice(0, 200) || 'Tailored Indian Fit',
    fitNotes: product.fitNotes.trim().slice(0, 300) || 'Tailored Indian fit.',
    sizes: safeSizes.map((s) => s.slice(0, 24)),
    colors: safeColors,
    stock: product.stock || {},
    featured: Boolean(product.featured),
  };
}

export function subscribeProducts(
  onData: (products: Product[]) => void,
): () => void {
  const path = 'products';
  const q = query(collection(db, path));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const list: Product[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          sku: String(data.sku ?? ''),
          name: String(data.name ?? ''),
          category: data.category as Product['category'],
          priceInr: Number(data.priceInr ?? 0),
          discountPercent:
            typeof data.discountPercent === 'number'
              ? data.discountPercent
              : 0,
          image: resolveCatalogAssetUrl(String(data.image ?? '')),
          galleryImages: Array.isArray(data.galleryImages)
            ? (data.galleryImages as string[]).map((u) =>
                resolveCatalogAssetUrl(String(u)),
              )
            : undefined,
          description: String(data.description ?? ''),
          fabric: String(data.fabric ?? ''),
          origin: String(data.origin ?? ''),
          fitNotes: String(data.fitNotes ?? ''),
          sizes: Array.isArray(data.sizes) ? (data.sizes as string[]) : [],
          colors: Array.isArray(data.colors)
            ? (data.colors as Product['colors']).map((c) => ({
                ...c,
                ...(c.previewImage
                  ? { previewImage: resolveCatalogAssetUrl(c.previewImage) }
                  : {}),
              }))
            : [],
          stock:
            data.stock && typeof data.stock === 'object'
              ? (data.stock as Product['stock'])
              : {},
          featured: Boolean(data.featured),
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export function subscribeStorefrontSettings(
  onData: (settings: StorefrontSettings | null) => void,
): () => void {
  const path = 'storefront/settings';
  return onSnapshot(
    doc(db, 'storefront', 'settings'),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const data = snap.data();
      onData({
        logoDataUrl:
          typeof data.logoDataUrl === 'string' ? data.logoDataUrl : null,
        showWordmark: data.showWordmark !== false,
        brandName: String(
          data.brandName ?? DEFAULT_STOREFRONT_SETTINGS.brandName,
        ),
        tagline: String(data.tagline ?? DEFAULT_STOREFRONT_SETTINGS.tagline),
        phone: String(data.phone ?? DEFAULT_STOREFRONT_SETTINGS.phone),
        email: String(data.email ?? DEFAULT_STOREFRONT_SETTINGS.email),
        address: String(data.address ?? DEFAULT_STOREFRONT_SETTINGS.address),
        showrooms: String(
          data.showrooms ?? DEFAULT_STOREFRONT_SETTINGS.showrooms,
        ),
        hours: String(data.hours ?? DEFAULT_STOREFRONT_SETTINGS.hours),
        freeShippingAboveInr: Number(
          data.freeShippingAboveInr ??
            DEFAULT_STOREFRONT_SETTINGS.freeShippingAboveInr,
        ),
        shippingChargeInr: Number(
          data.shippingChargeInr ??
            DEFAULT_STOREFRONT_SETTINGS.shippingChargeInr,
        ),
        returnWindowDays: Number(
          data.returnWindowDays ??
            DEFAULT_STOREFRONT_SETTINGS.returnWindowDays,
        ),
        deliveryDaysText: String(
          data.deliveryDaysText ??
            DEFAULT_STOREFRONT_SETTINGS.deliveryDaysText,
        ),
        returnDeductionText: String(
          data.returnDeductionText ??
            DEFAULT_STOREFRONT_SETTINGS.returnDeductionText,
        ),
        discountEnabled: Boolean(data.discountEnabled),
        discountTitle: String(
          data.discountTitle ?? DEFAULT_STOREFRONT_SETTINGS.discountTitle,
        ),
        discountType: data.discountType === 'flat' ? 'flat' : 'percent',
        discountValue: Number(
          data.discountValue ?? DEFAULT_STOREFRONT_SETTINGS.discountValue ?? 0,
        ),
        discountCode: String(data.discountCode ?? ''),
        discountMinOrderInr: Number(data.discountMinOrderInr ?? 0),
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export function subscribeOrders(
  onData: (orders: OrderReceipt[]) => void,
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: OrderReceipt[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdTs = data.createdAt as Timestamp | undefined;
        return {
          id: d.id,
          orderNumber: String(data.orderNumber ?? d.id),
          customerName: String(data.customerName ?? ''),
          phone: String(data.phone ?? ''),
          email: String(data.email ?? ''),
          address: String(data.address ?? ''),
          city: String(data.city ?? ''),
          pinCode: String(data.pinCode ?? ''),
          paymentMethod: data.paymentMethod as OrderReceipt['paymentMethod'],
          items: Array.isArray(data.items)
            ? (data.items as OrderReceipt['items'])
            : [],
          subtotalInr: Number(data.subtotalInr ?? 0),
          discountInr:
            typeof data.discountInr === 'number' ? data.discountInr : 0,
          discountCode:
            typeof data.discountCode === 'string' ? data.discountCode : '',
          shippingInr: Number(data.shippingInr ?? 0),
          totalInr: Number(data.totalInr ?? 0),
          estimatedDelivery: String(data.estimatedDelivery ?? ''),
          status: (data.status as OrderStatus) ?? 'placed',
          createdAtMs: createdTs ? createdTs.toMillis() : Date.now(),
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export async function saveProductToCloud(product: Product): Promise<void> {
  const payload = sanitizeProductPayload(product);
  const path = `products/${payload.id}`;
  const ref = doc(db, 'products', payload.id);

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      const { id: _id, ...updateFields } = payload;
      await updateDoc(ref, {
        ...updateFields,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  const cleanId = sanitizeProductId(productId);
  const path = `products/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'products', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedInitialCatalogToCloud(): Promise<number> {
  const path = 'products';
  try {
    const existingSnap = await getDocs(collection(db, path));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const batch = writeBatch(db);
    let added = 0;

    for (const item of INITIAL_PRODUCTS) {
      const payload = sanitizeProductPayload(item);
      if (!existingIds.has(payload.id)) {
        batch.set(doc(db, 'products', payload.id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        added += 1;
      }
    }
    if (added > 0) {
      await batch.commit();
    }
    return added;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveStorefrontSettingsToCloud(
  settings: StorefrontSettings,
): Promise<void> {
  const path = 'storefront/settings';
  try {
    await setDoc(doc(db, 'storefront', 'settings'), {
      logoDataUrl: settings.logoDataUrl
        ? settings.logoDataUrl.slice(0, 440000)
        : null,
      showWordmark: Boolean(settings.showWordmark),
      brandName:
        settings.brandName.trim().slice(0, 80) ||
        DEFAULT_STOREFRONT_SETTINGS.brandName,
      tagline:
        settings.tagline.trim().slice(0, 100) ||
        DEFAULT_STOREFRONT_SETTINGS.tagline,
      phone:
        settings.phone.trim().slice(0, 40) || DEFAULT_STOREFRONT_SETTINGS.phone,
      email:
        settings.email.trim().slice(0, 120) || DEFAULT_STOREFRONT_SETTINGS.email,
      address:
        settings.address.trim().slice(0, 300) ||
        DEFAULT_STOREFRONT_SETTINGS.address,
      showrooms:
        settings.showrooms.trim().slice(0, 300) ||
        DEFAULT_STOREFRONT_SETTINGS.showrooms,
      hours:
        settings.hours.trim().slice(0, 120) || DEFAULT_STOREFRONT_SETTINGS.hours,
      freeShippingAboveInr: Math.max(
        0,
        Math.min(100000, Math.round(settings.freeShippingAboveInr)),
      ),
      shippingChargeInr: Math.max(
        0,
        Math.min(10000, Math.round(settings.shippingChargeInr)),
      ),
      returnWindowDays: Math.max(
        1,
        Math.min(60, Math.round(settings.returnWindowDays)),
      ),
      deliveryDaysText:
        settings.deliveryDaysText.trim().slice(0, 120) ||
        DEFAULT_STOREFRONT_SETTINGS.deliveryDaysText,
      returnDeductionText:
        settings.returnDeductionText.trim().slice(0, 240) ||
        DEFAULT_STOREFRONT_SETTINGS.returnDeductionText,
      discountEnabled: Boolean(settings.discountEnabled),
      discountTitle:
        (settings.discountTitle ?? '').trim().slice(0, 80) ||
        'Customer Discount',
      discountType: settings.discountType === 'flat' ? 'flat' : 'percent',
      discountValue: Math.max(
        0,
        Math.min(
          settings.discountType === 'flat' ? 100000 : 90,
          Math.round(settings.discountValue ?? 0),
        ),
      ),
      discountCode: (settings.discountCode ?? '')
        .trim()
        .toUpperCase()
        .slice(0, 32),
      discountMinOrderInr: Math.max(
        0,
        Math.min(500000, Math.round(settings.discountMinOrderInr ?? 0)),
      ),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createOrderInCloud(receipt: OrderReceipt): Promise<string> {
  const orderId = sanitizeProductId(
    `${receipt.orderNumber}-${Date.now().toString(36)}`,
  );
  const path = `orders/${orderId}`;
  try {
    await setDoc(doc(db, 'orders', orderId), {
      orderNumber: receipt.orderNumber.slice(0, 40),
      customerName: receipt.customerName.trim().slice(0, 120),
      phone: receipt.phone.trim().slice(0, 30),
      email: receipt.email.trim().slice(0, 160),
      address: receipt.address.trim().slice(0, 300),
      city: receipt.city.trim().slice(0, 100),
      pinCode: receipt.pinCode.trim().slice(0, 12),
      paymentMethod: receipt.paymentMethod,
      items: receipt.items.slice(0, 50),
      subtotalInr: Math.max(1, Math.round(receipt.subtotalInr)),
      ...(receipt.discountInr && receipt.discountInr > 0
        ? { discountInr: Math.round(receipt.discountInr) }
        : {}),
      ...(receipt.discountCode?.trim()
        ? { discountCode: receipt.discountCode.trim().slice(0, 32) }
        : {}),
      shippingInr: Math.max(0, Math.round(receipt.shippingInr)),
      totalInr: Math.max(1, Math.round(receipt.totalInr)),
      estimatedDelivery: receipt.estimatedDelivery.slice(0, 100),
      status: 'placed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatusInCloud(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const cleanId = sanitizeProductId(orderId);
  const path = `orders/${cleanId}`;
  try {
    await updateDoc(doc(db, 'orders', cleanId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function recordCustomerVisitInCloud(
  visit: Omit<CustomerVisit, 'createdAtMs'>,
): Promise<void> {
  const cleanId = sanitizeProductId(visit.id);
  const cleanVisitorId = sanitizeProductId(visit.visitorId);
  const path = `visits/${cleanId}`;
  try {
    await setDoc(doc(db, 'visits', cleanId), {
      id: cleanId,
      visitorId: cleanVisitorId,
      isReturning: Boolean(visit.isReturning),
      deviceType: visit.deviceType,
      browser: (visit.browser || 'Browser').trim().slice(0, 60) || 'Browser',
      referrer: (visit.referrer || 'Direct').trim().slice(0, 200) || 'Direct',
      landingPath: (visit.landingPath || '/').trim().slice(0, 160) || '/',
      screenSize: (visit.screenSize || 'Unknown').trim().slice(0, 32) || 'Unknown',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeVisits(
  onData: (visits: CustomerVisit[]) => void,
): () => void {
  const path = 'visits';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CustomerVisit[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdTs = data.createdAt as Timestamp | undefined;
        const rawDevice = String(data.deviceType ?? 'Desktop');
        const deviceType: CustomerVisit['deviceType'] =
          rawDevice === 'Mobile' || rawDevice === 'Tablet'
            ? rawDevice
            : 'Desktop';
        return {
          id: String(data.id ?? d.id),
          visitorId: String(data.visitorId ?? ''),
          isReturning: Boolean(data.isReturning),
          deviceType,
          browser: String(data.browser ?? 'Browser'),
          referrer: String(data.referrer ?? 'Direct'),
          landingPath: String(data.landingPath ?? '/'),
          screenSize: String(data.screenSize ?? ''),
          createdAtMs: createdTs ? createdTs.toMillis() : Date.now(),
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export async function deleteVisitFromCloud(visitId: string): Promise<void> {
  const cleanId = sanitizeProductId(visitId);
  const path = `visits/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'visits', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllVisitsFromCloud(
  visitIds: string[],
): Promise<void> {
  const path = 'visits';
  try {
    const chunkSize = 400;
    for (let i = 0; i < visitIds.length; i += chunkSize) {
      const batch = writeBatch(db);
      const slice = visitIds.slice(i, i + chunkSize);
      slice.forEach((id) => {
        batch.delete(doc(db, 'visits', sanitizeProductId(id)));
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
