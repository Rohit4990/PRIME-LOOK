import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import {
  Check,
  Database,
  Eye,
  ImagePlus,
  Lock,
  LogOut,
  Monitor,
  Package,
  Plus,
  RotateCcw,
  Settings,
  ShoppingCart,
  Smartphone,
  Tablet,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ATELIER_PALETTE, formatINR, getEffectivePriceInr } from '../data/catalog';
import { OWNER_ADMIN_EMAIL, auth, googleProvider } from '../firebase';
import {
  DEFAULT_STOREFRONT_SETTINGS,
  clearAllVisitsFromCloud,
  deleteProductFromCloud,
  deleteVisitFromCloud,
  saveProductToCloud,
  saveStorefrontSettingsToCloud,
  seedInitialCatalogToCloud,
  subscribeOrders,
  subscribeVisits,
  updateOrderStatusInCloud,
} from '../services/firestoreStore';
import {
  ColorFamily,
  CustomerVisit,
  GarmentColor,
  OrderReceipt,
  OrderStatus,
  Product,
  ProductCategory,
  StorefrontSettings,
} from '../types';
import { compressImageFile } from '../utils/imageCompress';
import { GarmentImage } from './GarmentImage';

interface OwnerBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  cloudProducts: Product[];
  isUsingDefaultCatalog: boolean;
  settings: StorefrontSettings;
}

type AdminTab = 'products' | 'orders' | 'visits' | 'settings';

const SHIRT_SIZES = ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'];
const TEE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLOR_FAMILIES: Array<Exclude<ColorFamily, 'All'>> = [
  'Ivory & Sand',
  'Emerald & Olive',
  'Burgundy Wine',
  'Camel & Espresso',
  'Obsidian Black',
];

function createEmptyProduct(): Product {
  const defaultColor: GarmentColor = {
    name: 'Ivory Giza',
    hex: '#F4EFE4',
    family: 'Ivory & Sand',
    previewImage: ATELIER_PALETTE.ivoryGiza.previewImage,
  };
  const stock: Record<string, Record<string, number>> = {
    [defaultColor.name]: {
      '38 (S)': 8,
      '40 (M)': 10,
      '42 (L)': 10,
      '44 (XL)': 6,
      '46 (XXL)': 4,
    },
  };
  return {
    id: `pl-${Date.now().toString(36)}`,
    sku: `PL-IN-${Math.floor(100 + Math.random() * 899)}`,
    name: '',
    category: 'Shirts',
    priceInr: 3990,
    image: ATELIER_PALETTE.ivoryGiza.previewImage ?? '',
    description: '',
    fabric: '100% Pure Giza Cotton',
    origin: 'Tailored Indian Fit',
    fitNotes: 'Tailored architectural cut.',
    sizes: SHIRT_SIZES,
    colors: [defaultColor],
    stock,
    featured: false,
  };
}

export function OwnerBackendModal({
  isOpen,
  onClose,
  user,
  cloudProducts,
  isUsingDefaultCatalog,
  settings,
}: OwnerBackendModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Orders & Customer Visits live feeds (only attached when authenticated as owner)
  const [orders, setOrders] = useState<OrderReceipt[]>([]);
  const [visits, setVisits] = useState<CustomerVisit[]>([]);
  const [visitsBusy, setVisitsBusy] = useState(false);

  // Product editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [productBusy, setProductBusy] = useState(false);
  const [productMsg, setProductMsg] = useState('');
  const productPhotoRef = useRef<HTMLInputElement>(null);
  const galleryPhotoRef = useRef<HTMLInputElement>(null);

  // Settings editor state
  const [draftSettings, setDraftSettings] =
    useState<StorefrontSettings>(settings);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const logoFileRef = useRef<HTMLInputElement>(null);

  const isOwnerVerified =
    Boolean(user) &&
    user?.email?.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase() &&
    user?.emailVerified === true;

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    if (!isOpen || !isOwnerVerified) {
      setOrders([]);
      setVisits([]);
      return;
    }
    const unsubOrders = subscribeOrders((list) => setOrders(list));
    const unsubVisits = subscribeVisits((list) => setVisits(list));
    return () => {
      unsubOrders();
      unsubVisits();
    };
  }, [isOpen, isOwnerVerified]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google sign-in failed.',
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSeedCatalog = async () => {
    setProductBusy(true);
    setProductMsg('');
    try {
      const count = await seedInitialCatalogToCloud();
      setProductMsg(
        count > 0
          ? `Synced ${count} signature products to Cloud Firestore.`
          : 'All default products are already in Cloud Firestore.',
      );
    } catch (err) {
      setProductMsg(
        err instanceof Error ? err.message : 'Failed to sync catalog.',
      );
    } finally {
      setProductBusy(false);
    }
  };

  const handleProductPhotoUpload = async (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setProductMsg('');
    try {
      const compressed = await compressImageFile(file, 900, false);
      setEditingProduct((prev) => {
        if (!prev) return prev;
        const nextColors = prev.colors.map((c, idx) =>
          idx === 0 ? { ...c, previewImage: compressed } : c,
        );
        return { ...prev, image: compressed, colors: nextColors };
      });
    } catch (err) {
      setProductMsg(
        err instanceof Error ? err.message : 'Could not process product photo.',
      );
    }
  };

  const handleGalleryPhotosUpload = async (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0 || !editingProduct) return;
    setProductMsg('');
    try {
      const existing = editingProduct.galleryImages ?? [];
      const slotsLeft = Math.max(0, 5 - existing.length);
      const selected = files.slice(0, slotsLeft || 5);
      const compressedList = await Promise.all(
        selected.map((f) => compressImageFile(f, 560, false)),
      );
      setEditingProduct((prev) => {
        if (!prev) return prev;
        const merged = [...(prev.galleryImages ?? []), ...compressedList].slice(
          0,
          5,
        );
        return { ...prev, galleryImages: merged };
      });
    } catch (err) {
      setProductMsg(
        err instanceof Error
          ? err.message
          : 'Could not process gallery photos.',
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProductBusy(true);
    setProductMsg('');
    try {
      if (isUsingDefaultCatalog) {
        await seedInitialCatalogToCloud();
      }
      await saveProductToCloud(editingProduct);
      setProductMsg('Product saved to Cloud Firestore.');
      setEditingProduct(null);
      setIsNewProduct(false);
    } catch (err) {
      setProductMsg(
        err instanceof Error ? err.message : 'Failed to save product.',
      );
    } finally {
      setProductBusy(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProductBusy(true);
    setProductMsg('');
    try {
      await deleteProductFromCloud(productId);
      setProductMsg('Product deleted from database.');
    } catch (err) {
      setProductMsg(
        err instanceof Error ? err.message : 'Failed to delete product.',
      );
    } finally {
      setProductBusy(false);
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSettingsMsg('');
    try {
      const compressed = await compressImageFile(file, 480, true);
      setDraftSettings((prev) => ({ ...prev, logoDataUrl: compressed }));
    } catch (err) {
      setSettingsMsg(
        err instanceof Error ? err.message : 'Could not process logo.',
      );
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSettingsBusy(true);
    setSettingsMsg('');
    try {
      await saveStorefrontSettingsToCloud(draftSettings);
      setSettingsMsg('Storefront settings saved to Cloud Firestore.');
    } catch (err) {
      setSettingsMsg(
        err instanceof Error ? err.message : 'Failed to save settings.',
      );
    } finally {
      setSettingsBusy(false);
    }
  };

  const handleResetSettings = async () => {
    setSettingsBusy(true);
    setSettingsMsg('');
    try {
      setDraftSettings(DEFAULT_STOREFRONT_SETTINGS);
      await saveStorefrontSettingsToCloud(DEFAULT_STOREFRONT_SETTINGS);
      setSettingsMsg('Restored default store settings in Cloud Firestore.');
    } catch (err) {
      setSettingsMsg(
        err instanceof Error ? err.message : 'Failed to reset settings.',
      );
    } finally {
      setSettingsBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/65 backdrop-blur-sm p-0 md:p-6 overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-backend-title"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-5xl max-h-[92vh] bg-[#FFFFFF] rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-[#D6CFC3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="px-5 sm:px-7 py-4 bg-[#1C1917] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#144534] border border-[#D6B376]/50 flex items-center justify-center">
              <Database className="w-4.5 h-4.5 text-[#D6B376]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D6B376]">
                Cloud Firestore Backend
              </p>
              <h2
                id="owner-backend-title"
                className="font-display text-xl sm:text-2xl font-semibold text-white leading-none"
              >
                Owner Backend Studio
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-[38px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close owner backend"
              className="w-10 h-10 flex items-center justify-center rounded-full text-white/85 hover:bg-white/15 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate or Verified Owner Workspace */}
        {!user ? (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#D6CFC3] flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#144534]" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-black">
              Store Owner Sign-In
            </h3>
            <p className="text-sm text-[#57524C] max-w-md leading-relaxed">
              Sign in with your verified Google owner account (
              <strong className="text-black">{OWNER_ADMIN_EMAIL}</strong>) to
              add or edit products, upload photos &amp; logo, update prices,
              policies, and manage customer orders.
            </p>
            {authError && (
              <p className="text-xs font-semibold text-[#8C2D2D] bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                {authError}
              </p>
            )}
            <button
              type="button"
              disabled={authBusy}
              onClick={handleGoogleSignIn}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#144534] text-white text-sm font-semibold hover:bg-[#0E3427] disabled:opacity-60 cursor-pointer"
            >
              {authBusy ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </div>
        ) : !isOwnerVerified ? (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#8C2D2D]" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-black">
              Owner Access Restricted
            </h3>
            <p className="text-sm text-[#57524C] max-w-md">
              Signed in as <strong className="text-black">{user.email}</strong>.
              Backend management is restricted to the verified owner account{' '}
              <strong className="text-black">{OWNER_ADMIN_EMAIL}</strong>.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1C1917] text-white text-sm font-semibold cursor-pointer"
            >
              Switch Google Account
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-5 sm:px-7 py-2.5 bg-[#FAF8F5] border-b border-[#E6DFD3] flex items-center justify-between gap-3 flex-wrap shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-[#144534] text-white'
                      : 'bg-white text-black border border-[#D6CFC3]'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products &amp; Stock ({cloudProducts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-[#144534] text-white'
                      : 'bg-white text-black border border-[#D6CFC3]'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Customer Orders ({orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('visits')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'visits'
                      ? 'bg-[#144534] text-white'
                      : 'bg-white text-black border border-[#D6CFC3]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Customer Visits ({visits.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#144534] text-white'
                      : 'bg-white text-black border border-[#D6CFC3]'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Logo, Contact &amp; Policies</span>
                </button>
              </div>

              <span className="text-[11px] font-semibold text-[#144534]">
                Signed in: {user.email}
              </span>
            </div>

            {/* Active Tab Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7">
              {activeTab === 'products' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-black">
                        {editingProduct
                          ? isNewProduct
                            ? 'Add New Product'
                            : `Edit: ${editingProduct.name}`
                          : 'Cloud Product Catalog'}
                      </h3>
                      <p className="text-xs text-[#57524C]">
                        Changes sync immediately across all visitors.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isUsingDefaultCatalog && !editingProduct && (
                        <button
                          type="button"
                          disabled={productBusy}
                          onClick={handleSeedCatalog}
                          className="min-h-[40px] px-3.5 rounded-lg border border-[#144534] bg-[#FAF8F5] text-xs font-bold text-[#144534] hover:bg-[#144534] hover:text-white transition-colors cursor-pointer"
                        >
                          Sync Default 8 Items to Cloud
                        </button>
                      )}
                      {!editingProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(createEmptyProduct());
                            setIsNewProduct(true);
                            setProductMsg('');
                          }}
                          className="min-h-[40px] px-4 rounded-lg bg-[#144534] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#0E3427] cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Product</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {productMsg && (
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#144534]/30 text-xs font-semibold text-[#144534] flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{productMsg}</span>
                    </div>
                  )}

                  {editingProduct ? (
                    <form
                      onSubmit={handleSaveProduct}
                      className="space-y-5 p-5 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3]"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* Photo Upload Column */}
                        <div className="md:col-span-4 space-y-3">
                          <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[#D6CFC3] bg-white">
                            <GarmentImage
                              src={editingProduct.image}
                              alt={editingProduct.name || 'Product Preview'}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <input
                            ref={productPhotoRef}
                            type="file"
                            accept="image/*"
                            onChange={handleProductPhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => productPhotoRef.current?.click()}
                            className="w-full min-h-[42px] px-3 rounded-lg border border-[#144534] bg-white text-xs font-bold text-[#144534] inline-flex items-center justify-center gap-1.5 hover:bg-[#144534] hover:text-white transition-colors cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo From Device</span>
                          </button>
                          <input
                            type="text"
                            value={editingProduct.image}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                image: e.target.value,
                              })
                            }
                            placeholder="Or paste main image URL..."
                            className="w-full min-h-[38px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs text-black"
                          />

                          {/* Up to 5 Detail Gallery Photos */}
                          <div className="pt-2 border-t border-[#E6DFD3] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-black">
                                Detail Photos ({(editingProduct.galleryImages ?? []).length}/5)
                              </span>
                              <button
                                type="button"
                                onClick={() => galleryPhotoRef.current?.click()}
                                className="text-[11px] font-bold text-[#144534] hover:underline cursor-pointer"
                              >
                                + Add Detail Photos
                              </button>
                            </div>
                            <input
                              ref={galleryPhotoRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleGalleryPhotosUpload}
                              className="hidden"
                            />
                            <div className="grid grid-cols-5 gap-1.5">
                              {(editingProduct.galleryImages ?? []).map(
                                (imgUrl, gIdx) => (
                                  <div
                                    key={gIdx}
                                    className="relative aspect-[3/4] rounded border border-[#D6CFC3] bg-white overflow-hidden group"
                                  >
                                    <GarmentImage
                                      src={imgUrl}
                                      alt={`Detail ${gIdx + 1}`}
                                      className="w-full h-full object-cover object-top"
                                    />
                                    <button
                                      type="button"
                                      aria-label={`Remove detail photo ${gIdx + 1}`}
                                      onClick={() =>
                                        setEditingProduct({
                                          ...editingProduct,
                                          galleryImages: (
                                            editingProduct.galleryImages ?? []
                                          ).filter((_, idx) => idx !== gIdx),
                                        })
                                      }
                                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/75 text-white text-[10px] flex items-center justify-center cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Fields Column */}
                        <div className="md:col-span-8 space-y-3.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-black mb-1">
                                Product Name
                              </label>
                              <input
                                type="text"
                                required
                                value={editingProduct.name}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="e.g. Bandra Pure Linen Shirt"
                                className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm text-black"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-black mb-1">
                                SKU Code
                              </label>
                              <input
                                type="text"
                                required
                                value={editingProduct.sku}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    sku: e.target.value,
                                  })
                                }
                                className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm text-black"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-black mb-1">
                                Category
                              </label>
                              <select
                                value={editingProduct.category}
                                onChange={(e) => {
                                  const nextCat = e.target
                                    .value as ProductCategory;
                                  const nextSizes =
                                    nextCat === 'Shirts'
                                      ? SHIRT_SIZES
                                      : TEE_SIZES;
                                  const nextStock: Record<
                                    string,
                                    Record<string, number>
                                  > = {};
                                  editingProduct.colors.forEach((c) => {
                                    nextStock[c.name] = {};
                                    nextSizes.forEach((s) => {
                                      nextStock[c.name][s] =
                                        editingProduct.stock[c.name]?.[s] ?? 8;
                                    });
                                  });
                                  setEditingProduct({
                                    ...editingProduct,
                                    category: nextCat,
                                    sizes: nextSizes,
                                    stock: nextStock,
                                  });
                                }}
                                className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm text-black"
                              >
                                <option value="Shirts">Shirts</option>
                                <option value="T-Shirts">T-Shirts</option>
                                <option value="Polo T-Shirts">
                                  Polo T-Shirts
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-black mb-1">
                                MRP Price (₹ INR)
                              </label>
                              <input
                                type="number"
                                required
                                min={99}
                                value={editingProduct.priceInr}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    priceInr: Number(e.target.value),
                                  })
                                }
                                className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm font-mono text-black"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-black mb-1">
                                Discount (% OFF)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={90}
                                value={editingProduct.discountPercent ?? 0}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    discountPercent: Math.max(
                                      0,
                                      Math.min(90, Number(e.target.value) || 0),
                                    ),
                                  })
                                }
                                className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm font-mono text-black"
                              />
                              {(editingProduct.discountPercent ?? 0) > 0 && (
                                <p className="mt-1 text-[10px] font-bold text-[#144534] tabular-nums">
                                  Final: {formatINR(getEffectivePriceInr(editingProduct))}
                                </p>
                              )}
                            </div>
                            <label className="flex items-center gap-2 pt-6 text-xs font-bold text-black cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(editingProduct.featured)}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    featured: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 accent-[#144534]"
                              />
                              <span>Featured Item</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-black mb-1">
                                Fabric
                              </label>
                              <input
                                type="text"
                                required
                                value={editingProduct.fabric}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    fabric: e.target.value,
                                  })
                                }
                                className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs text-black"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-black mb-1">
                                Origin
                              </label>
                              <input
                                type="text"
                                required
                                value={editingProduct.origin}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    origin: e.target.value,
                                  })
                                }
                                className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs text-black"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-black mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={editingProduct.description}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  description: e.target.value,
                                })
                              }
                              className="w-full p-2.5 rounded-lg border border-[#D6CFC3] bg-white text-xs text-black"
                            />
                          </div>

                          {/* Primary Shade & Stock Matrix */}
                          <div className="p-3.5 rounded-lg bg-white border border-[#D6CFC3] space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-black">
                                Shades &amp; Stock Quantities
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newShadeName = `Shade ${editingProduct.colors.length + 1}`;
                                  const nextShade: GarmentColor = {
                                    name: newShadeName,
                                    hex: '#144534',
                                    family: 'Emerald & Olive',
                                    previewImage: editingProduct.image,
                                  };
                                  const sizeStock: Record<string, number> = {};
                                  editingProduct.sizes.forEach((s) => {
                                    sizeStock[s] = 6;
                                  });
                                  setEditingProduct({
                                    ...editingProduct,
                                    colors: [
                                      ...editingProduct.colors,
                                      nextShade,
                                    ],
                                    stock: {
                                      ...editingProduct.stock,
                                      [newShadeName]: sizeStock,
                                    },
                                  });
                                }}
                                className="text-[11px] font-bold text-[#144534] hover:underline cursor-pointer"
                              >
                                + Add Shade
                              </button>
                            </div>

                            {editingProduct.colors.map((c, ci) => (
                              <div
                                key={ci}
                                className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] space-y-2"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    type="color"
                                    value={c.hex}
                                    onChange={(e) => {
                                      const next = [...editingProduct.colors];
                                      next[ci] = {
                                        ...next[ci],
                                        hex: e.target.value,
                                      };
                                      setEditingProduct({
                                        ...editingProduct,
                                        colors: next,
                                      });
                                    }}
                                    className="w-8 h-8 rounded cursor-pointer border-0"
                                  />
                                  <input
                                    type="text"
                                    value={c.name}
                                    onChange={(e) => {
                                      const oldName = c.name;
                                      const newName = e.target.value;
                                      const nextColors = [
                                        ...editingProduct.colors,
                                      ];
                                      nextColors[ci] = {
                                        ...nextColors[ci],
                                        name: newName,
                                      };
                                      const nextStock = {
                                        ...editingProduct.stock,
                                      };
                                      if (oldName !== newName) {
                                        nextStock[newName] =
                                          nextStock[oldName] || {};
                                        delete nextStock[oldName];
                                      }
                                      setEditingProduct({
                                        ...editingProduct,
                                        colors: nextColors,
                                        stock: nextStock,
                                      });
                                    }}
                                    className="flex-1 min-w-[120px] min-h-[34px] px-2.5 rounded border border-[#D6CFC3] bg-white text-xs font-semibold text-black"
                                  />
                                  <select
                                    value={c.family}
                                    onChange={(e) => {
                                      const next = [...editingProduct.colors];
                                      next[ci] = {
                                        ...next[ci],
                                        family: e.target
                                          .value as Exclude<ColorFamily, 'All'>,
                                      };
                                      setEditingProduct({
                                        ...editingProduct,
                                        colors: next,
                                      });
                                    }}
                                    className="min-h-[34px] px-2 rounded border border-[#D6CFC3] bg-white text-xs text-black"
                                  >
                                    {COLOR_FAMILIES.map((fam) => (
                                      <option key={fam} value={fam}>
                                        {fam}
                                      </option>
                                    ))}
                                  </select>
                                  {editingProduct.colors.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextColors =
                                          editingProduct.colors.filter(
                                            (_, idx) => idx !== ci,
                                          );
                                        const nextStock = {
                                          ...editingProduct.stock,
                                        };
                                        delete nextStock[c.name];
                                        setEditingProduct({
                                          ...editingProduct,
                                          colors: nextColors,
                                          stock: nextStock,
                                        });
                                      }}
                                      className="p-1.5 text-[#8C2D2D] hover:bg-red-50 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-5 gap-1.5">
                                  {editingProduct.sizes.map((size) => (
                                    <div key={size}>
                                      <label className="block text-[10px] font-semibold text-[#57524C] mb-0.5">
                                        {size}
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={
                                          editingProduct.stock[c.name]?.[size] ??
                                          0
                                        }
                                        onChange={(e) => {
                                          const qty = Math.max(
                                            0,
                                            Number(e.target.value),
                                          );
                                          setEditingProduct({
                                            ...editingProduct,
                                            stock: {
                                              ...editingProduct.stock,
                                              [c.name]: {
                                                ...(editingProduct.stock[
                                                  c.name
                                                ] || {}),
                                                [size]: qty,
                                              },
                                            },
                                          });
                                        }}
                                        className="w-full min-h-[32px] px-2 rounded border border-[#D6CFC3] bg-white text-xs font-mono text-black"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#D6CFC3] flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(null);
                            setIsNewProduct(false);
                          }}
                          className="min-h-[42px] px-4 rounded-lg border border-[#D6CFC3] bg-white text-xs font-bold text-black cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={productBusy}
                          className="min-h-[42px] px-5 rounded-lg bg-[#144534] text-white text-xs font-bold hover:bg-[#0E3427] disabled:opacity-60 cursor-pointer"
                        >
                          {productBusy ? 'Saving...' : 'Save Product to Cloud'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cloudProducts.map((p) => {
                        const totalUnits = Object.values(p.stock).reduce(
                          (acc, sizes) =>
                            acc +
                            Object.values(sizes).reduce((s, q) => s + q, 0),
                          0,
                        );
                        return (
                          <div
                            key={p.id}
                            className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] flex items-center gap-3.5"
                          >
                            <div className="w-16 h-20 rounded-lg overflow-hidden bg-white border border-[#D6CFC3] shrink-0">
                              <GarmentImage
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-[#8C6A36] uppercase">
                                {p.category} · {p.sku}
                              </p>
                              <h4 className="text-sm font-bold text-black truncate">
                                {p.name}
                              </h4>
                              <p className="text-xs font-semibold text-black mt-0.5 tabular-nums">
                                {formatINR(getEffectivePriceInr(p))}
                                {(p.discountPercent ?? 0) > 0 && (
                                  <span className="ml-1.5 text-[11px] font-bold text-[#144534]">
                                    ({p.discountPercent}% OFF)
                                  </span>
                                )}{' '}
                                · {totalUnits} units in stock
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setIsNewProduct(false);
                                    setProductMsg('');
                                  }}
                                  className="px-2.5 py-1 rounded bg-white border border-[#D6CFC3] hover:border-[#144534] text-[11px] font-bold text-black cursor-pointer"
                                >
                                  Edit
                                </button>
                                {!isUsingDefaultCatalog && (
                                  <button
                                    type="button"
                                    disabled={productBusy}
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="px-2.5 py-1 rounded bg-white border border-red-200 hover:bg-red-50 text-[11px] font-bold text-[#8C2D2D] cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-black">
                      Customer Orders (Real-Time)
                    </h3>
                    <p className="text-xs text-[#57524C]">
                      Every order placed on the storefront appears here live.
                    </p>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-10 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] text-center">
                      <ShoppingCart className="w-8 h-8 mx-auto text-[#6B655E] mb-2" />
                      <p className="text-sm font-bold text-black">
                        No orders placed yet
                      </p>
                      <p className="text-xs text-[#57524C] mt-1">
                        Orders placed via checkout will be saved in Firestore and
                        listed here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id ?? order.orderNumber}
                          className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E6DFD3]">
                            <div>
                              <p className="text-sm font-bold text-black">
                                Order #{order.orderNumber} ·{' '}
                                {order.customerName}
                              </p>
                              <p className="text-xs text-[#57524C]">
                                {order.phone} · {order.email}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-sm font-bold text-black tabular-nums block">
                                  {formatINR(order.totalInr)}
                                </span>
                                {(order.discountInr ?? 0) > 0 && (
                                  <span className="text-[10px] font-bold text-[#144534] tabular-nums">
                                    Discount: -{formatINR(order.discountInr ?? 0)}
                                    {order.discountCode
                                      ? ` (${order.discountCode})`
                                      : ''}
                                  </span>
                                )}
                              </div>
                              <select
                                value={order.status ?? 'placed'}
                                onChange={(e) => {
                                  if (order.id) {
                                    void updateOrderStatusInCloud(
                                      order.id,
                                      e.target.value as OrderStatus,
                                    );
                                  }
                                }}
                                className="min-h-[34px] px-2.5 rounded-lg border border-[#D6CFC3] bg-white text-xs font-bold text-black cursor-pointer"
                              >
                                <option value="placed">Placed</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="font-bold text-black">
                                Delivery Address
                              </p>
                              <p className="text-[#57524C]">
                                {order.address}, {order.city} — PIN{' '}
                                {order.pinCode}
                              </p>
                              <p className="text-[#57524C] mt-0.5">
                                Payment: {order.paymentMethod}
                              </p>
                            </div>
                            <div>
                              <p className="font-bold text-black">
                                Items Ordered
                              </p>
                              <ul className="space-y-0.5 text-[#57524C]">
                                {order.items.map((it, idx) => (
                                  <li key={idx}>
                                    {it.quantity}× {it.name} ({it.colorName},{' '}
                                    {it.size}) —{' '}
                                    {formatINR(it.priceInr * it.quantity)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'visits' && (() => {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const todayMs = startOfToday.getTime();
                const todaysVisitsCount = visits.filter(
                  (v) => (v.createdAtMs ?? 0) >= todayMs,
                ).length;
                const uniqueVisitorsCount = new Set(
                  visits.map((v) => v.visitorId).filter(Boolean),
                ).size;

                return (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-2xl font-semibold text-black">
                          Customer Visits
                        </h3>
                        <p className="text-xs text-[#57524C]">
                          Shows customer visits only (your own visits are hidden automatically).
                        </p>
                      </div>

                      {visits.length > 0 && (
                        <button
                          type="button"
                          disabled={visitsBusy}
                          onClick={async () => {
                            setVisitsBusy(true);
                            try {
                              await clearAllVisitsFromCloud(
                                visits.map((v) => v.id),
                              );
                            } finally {
                              setVisitsBusy(false);
                            }
                          }}
                          className="min-h-[38px] px-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-bold text-[#8C2D2D] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All</span>
                        </button>
                      )}
                    </div>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3]">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57524C]">
                          Total Visits
                        </p>
                        <p className="mt-1 text-2xl font-bold text-black tabular-nums">
                          {visits.length}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3]">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57524C]">
                          Today
                        </p>
                        <p className="mt-1 text-2xl font-bold text-[#144534] tabular-nums">
                          {todaysVisitsCount}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3]">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57524C]">
                          Unique Visitors
                        </p>
                        <p className="mt-1 text-2xl font-bold text-black tabular-nums">
                          {uniqueVisitorsCount}
                        </p>
                      </div>
                    </div>

                    {visits.length === 0 ? (
                      <div className="p-10 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] text-center">
                        <Eye className="w-8 h-8 mx-auto text-[#6B655E] mb-2" />
                        <p className="text-sm font-bold text-black">
                          No customer visits recorded yet
                        </p>
                        <p className="text-xs text-[#57524C] mt-1 max-w-md mx-auto">
                          Whenever a customer opens your storefront from any
                          other browser or device, their visit will appear here
                          automatically.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {visits.map((visit) => {
                          const DeviceIcon =
                            visit.deviceType === 'Mobile'
                              ? Smartphone
                              : visit.deviceType === 'Tablet'
                                ? Tablet
                                : Monitor;
                          const visitedAt = visit.createdAtMs
                            ? new Date(visit.createdAtMs).toLocaleString(
                                'en-IN',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )
                            : 'Just now';

                          return (
                            <div
                              key={visit.id}
                              className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] flex items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-white border border-[#D6CFC3] flex items-center justify-center shrink-0">
                                  <DeviceIcon className="w-4 h-4 text-[#144534]" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-black">
                                      {visit.deviceType} · {visit.browser}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        visit.isReturning
                                          ? 'bg-[#8C6A36]/15 text-[#8C6A36]'
                                          : 'bg-[#144534]/15 text-[#144534]'
                                      }`}
                                    >
                                      {visit.isReturning
                                        ? 'Returning Customer'
                                        : 'New Visitor'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#57524C] mt-0.5 truncate">
                                    Source: {visit.referrer} · Screen:{' '}
                                    {visit.screenSize} · Page:{' '}
                                    {visit.landingPath}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-semibold text-[#1C1917] tabular-nums whitespace-nowrap">
                                  {visitedAt}
                                </span>
                                <button
                                  type="button"
                                  aria-label="Delete visit log"
                                  onClick={() => {
                                    void deleteVisitFromCloud(visit.id);
                                  }}
                                  className="p-1.5 rounded-lg text-[#6B655E] hover:text-[#8C2D2D] hover:bg-white cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-black">
                        Logo, Contact &amp; Policy Settings
                      </h3>
                      <p className="text-xs text-[#57524C]">
                        Saved to Cloud Firestore and applied to every shopper.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={settingsBusy}
                      onClick={handleResetSettings}
                      className="min-h-[38px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs font-bold text-black inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>
                  </div>

                  {settingsMsg && (
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#144534]/30 text-xs font-semibold text-[#144534] flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{settingsMsg}</span>
                    </div>
                  )}

                  {/* Custom Logo Box */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] space-y-3">
                    <span className="block text-xs font-bold text-black">
                      Custom Brand Logo
                    </span>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="h-16 min-w-[140px] px-4 rounded-lg bg-white border border-[#D6CFC3] flex items-center justify-center">
                        {draftSettings.logoDataUrl ? (
                          <img
                            src={draftSettings.logoDataUrl}
                            alt="Logo preview"
                            className="h-11 w-auto max-w-[160px] object-contain"
                          />
                        ) : (
                          <span className="text-xs text-[#6B655E]">
                            Default P·L Crest
                          </span>
                        )}
                      </div>
                      <input
                        ref={logoFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="min-h-[40px] px-4 rounded-lg bg-white border border-[#144534] text-xs font-bold text-[#144534] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>Upload Logo</span>
                      </button>
                      {draftSettings.logoDataUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              logoDataUrl: null,
                            })
                          }
                          className="min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs font-semibold text-[#8C2D2D] cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                      <label className="flex items-center gap-2 text-xs font-semibold text-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftSettings.showWordmark}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              showWordmark: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#144534]"
                        />
                        <span>Show Brand Title</span>
                      </label>
                    </div>
                  </div>

                  {/* Contact & Store Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        required
                        value={draftSettings.brandName}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            brandName: e.target.value,
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">
                        Tagline
                      </label>
                      <input
                        type="text"
                        required
                        value={draftSettings.tagline}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            tagline: e.target.value,
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        required
                        value={draftSettings.phone}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            phone: e.target.value,
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">
                        Support Email
                      </label>
                      <input
                        type="email"
                        required
                        value={draftSettings.email}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            email: e.target.value,
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] text-sm text-black"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-black mb-1">
                        Store / Personal Address
                      </label>
                      <input
                        type="text"
                        required
                        value={draftSettings.address}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            address: e.target.value,
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">
                        Showrooms / Cities
                      </label>
                      <input
                        type="text"
                        required
                        value={draftSettings.showrooms}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            showrooms: e.target.value,
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">
                        Business Hours
                      </label>
                      <input
                        type="text"
                        required
                        value={draftSettings.hours}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            hours: e.target.value,
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-lg border border-[#D6CFC3] text-sm text-black"
                      />
                    </div>
                  </div>

                  {/* Shipping & Return Rules */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] space-y-3">
                    <span className="block text-xs font-bold text-black">
                      Shipping &amp; 5-Day Return Rules
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Free Delivery Above (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={draftSettings.freeShippingAboveInr}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              freeShippingAboveInr: Number(e.target.value),
                            })
                          }
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm font-mono text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Delivery Charge (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={draftSettings.shippingChargeInr}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              shippingChargeInr: Number(e.target.value),
                            })
                          }
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm font-mono text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Return Window (Days)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={draftSettings.returnWindowDays}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              returnWindowDays: Number(e.target.value),
                            })
                          }
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm font-mono text-black"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Delivery Timeline Text
                        </label>
                        <input
                          type="text"
                          required
                          value={draftSettings.deliveryDaysText}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              deliveryDaysText: e.target.value,
                            })
                          }
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Return Deduction Policy Text
                        </label>
                        <input
                          type="text"
                          required
                          value={draftSettings.returnDeductionText}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              returnDeductionText: e.target.value,
                            })
                          }
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs text-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Discounts & Promo Offers */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D6CFC3] space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#144534]" />
                        <span className="text-xs font-bold text-black">
                          Give Customer Discount / Promo Offer
                        </span>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs font-bold text-[#144534] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(draftSettings.discountEnabled)}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              discountEnabled: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#144534]"
                        />
                        <span>
                          {draftSettings.discountEnabled
                            ? 'Discount Active'
                            : 'Enable Discount'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Offer Name (Shown to Customers)
                        </label>
                        <input
                          type="text"
                          value={draftSettings.discountTitle ?? ''}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              discountTitle: e.target.value,
                            })
                          }
                          placeholder="e.g. Festive Customer Offer"
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Discount Type
                        </label>
                        <select
                          value={draftSettings.discountType ?? 'percent'}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              discountType:
                                e.target.value === 'flat' ? 'flat' : 'percent',
                            })
                          }
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs text-black"
                        >
                          <option value="percent">Percentage (% OFF)</option>
                          <option value="flat">Flat Amount (₹ OFF)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          {draftSettings.discountType === 'flat'
                            ? 'Discount Amount (₹)'
                            : 'Discount (%)'}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={
                            draftSettings.discountType === 'flat' ? 100000 : 90
                          }
                          value={draftSettings.discountValue ?? 0}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              discountValue: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm font-mono text-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Promo Code (Leave empty for automatic discount)
                        </label>
                        <input
                          type="text"
                          value={draftSettings.discountCode ?? ''}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              discountCode: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="e.g. PRIME10 or leave blank for auto"
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-xs font-mono text-black uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1">
                          Minimum Order Value (₹, 0 = All Orders)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={draftSettings.discountMinOrderInr ?? 0}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              discountMinOrderInr: Math.max(
                                0,
                                Number(e.target.value),
                              ),
                            })
                          }
                          className="w-full min-h-[40px] px-3 rounded-lg border border-[#D6CFC3] bg-white text-sm font-mono text-black"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={settingsBusy}
                      className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#144534] text-white text-sm font-bold hover:bg-[#0E3427] disabled:opacity-60 cursor-pointer"
                    >
                      {settingsBusy
                        ? 'Saving to Cloud...'
                        : 'Save All Settings to Cloud'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
