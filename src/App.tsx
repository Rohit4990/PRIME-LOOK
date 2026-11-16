import { useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Search, X } from 'lucide-react';
import { AtelierStory } from './components/AtelierStory';
import { BagDrawer } from './components/BagDrawer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MobileTabBar } from './components/MobileTabBar';
import { OwnerBackendModal } from './components/OwnerBackendModal';
import { PolicyModal, PolicyTab } from './components/PolicyModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailSheet } from './components/ProductDetailSheet';
import {
  CATEGORIES,
  INITIAL_PRODUCTS,
  getVariantStock,
} from './data/catalog';
import { OWNER_ADMIN_EMAIL, auth } from './firebase';
import {
  DEFAULT_STOREFRONT_SETTINGS,
  deleteVisitFromCloud,
  recordCustomerVisitInCloud,
  subscribeProducts,
  subscribeStorefrontSettings,
} from './services/firestoreStore';
import {
  BagItem,
  OrderReceipt,
  Product,
  ProductCategory,
  StorefrontSettings,
} from './types';

const STORAGE_BAG_KEY = 'primelook_india_bag_v5';
export const OWNER_DEVICE_STORAGE_KEY = 'primelook_owner_device_v1';
const VISITOR_ID_STORAGE_KEY = 'primelook_visitor_id_v1';
const SESSION_VISIT_ID_KEY = 'primelook_session_visit_id_v1';

function detectDeviceType(): 'Mobile' | 'Tablet' | 'Desktop' {
  const ua = navigator.userAgent || '';
  const w = window.innerWidth || 1200;
  if (/iPad|Tablet/i.test(ua) || (w >= 768 && w < 1024)) return 'Tablet';
  if (/Mobi|Android|iPhone/i.test(ua) || w < 768) return 'Mobile';
  return 'Desktop';
}

function detectBrowserName(): string {
  const ua = navigator.userAgent || '';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/Instagram/i.test(ua)) return 'Instagram App';
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook App';
  if (/WhatsApp/i.test(ua)) return 'WhatsApp Browser';
  if (/Chrome|CriOS/i.test(ua)) return 'Chrome';
  if (/Firefox|FxiOS/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua)) return 'Safari';
  return 'Web Browser';
}

function detectReferrerLabel(): string {
  try {
    if (!document.referrer) return 'Direct';
    const refUrl = new URL(document.referrer);
    if (refUrl.hostname === window.location.hostname) return 'Direct';
    return refUrl.hostname.replace(/^www\./, '') || 'Direct';
  } catch {
    return 'Direct';
  }
}

export default function App() {
  const [cloudProducts, setCloudProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [settings, setSettings] = useState<StorefrontSettings>(
    DEFAULT_STOREFRONT_SETTINGS,
  );
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [bagItems, setBagItems] = useState<BagItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BAG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is BagItem =>
              Boolean(item) &&
              typeof item === 'object' &&
              typeof item.productId === 'string' &&
              typeof item.colorName === 'string' &&
              typeof item.size === 'string' &&
              typeof item.quantity === 'number' &&
              Number.isFinite(item.quantity) &&
              item.quantity > 0,
          );
        }
      }
    } catch {
      // Fallback to empty bag
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState<
    'All' | ProductCategory
  >('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProductModal, setSelectedProductModal] = useState<{
    productId: string;
    colorName: string;
  } | null>(null);
  const [activePolicyModal, setActivePolicyModal] = useState<PolicyTab | null>(
    null,
  );
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);

  // Subscribe to Firebase Auth, Cloud Products & Cloud Storefront Settings
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (
        firebaseUser?.email?.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase()
      ) {
        try {
          localStorage.setItem(OWNER_DEVICE_STORAGE_KEY, '1');
          const preLoginVisitId = sessionStorage.getItem(SESSION_VISIT_ID_KEY);
          if (preLoginVisitId && firebaseUser.emailVerified) {
            sessionStorage.removeItem(SESSION_VISIT_ID_KEY);
            void deleteVisitFromCloud(preLoginVisitId).catch(() => {});
          }
        } catch {
          // Ignore storage errors
        }
      }
    });
    const unsubProducts = subscribeProducts((list) => {
      setCloudProducts(list);
      setProductsLoaded(true);
    });
    const unsubSettings = subscribeStorefrontSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    });

    const checkOwnerRoute = () => {
      const params = new URLSearchParams(window.location.search);
      if (window.location.hash === '#owner' || params.get('owner') === '1') {
        try {
          localStorage.setItem(OWNER_DEVICE_STORAGE_KEY, '1');
        } catch {
          // Ignore storage errors
        }
        setIsOwnerModalOpen(true);
      }
    };
    checkOwnerRoute();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        try {
          localStorage.setItem(OWNER_DEVICE_STORAGE_KEY, '1');
        } catch {
          // Ignore storage errors
        }
        setIsOwnerModalOpen(true);
      }
    };

    window.addEventListener('hashchange', checkOwnerRoute);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubAuth();
      unsubProducts();
      unsubSettings();
      window.removeEventListener('hashchange', checkOwnerRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Mark device as owner device whenever Owner Backend is opened
  useEffect(() => {
    if (!isOwnerModalOpen) return;
    try {
      localStorage.setItem(OWNER_DEVICE_STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  }, [isOwnerModalOpen]);

  // Record a real customer visit once per browser session (excluding the owner)
  useEffect(() => {
    if (!authReady) return;
    const isOwnerUser =
      user?.email?.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const isOwnerRoute =
      window.location.hash === '#owner' || params.get('owner') === '1';

    let isOwnerDevice = false;
    let existingSessionVisitId: string | null = null;
    try {
      isOwnerDevice = localStorage.getItem(OWNER_DEVICE_STORAGE_KEY) === '1';
      existingSessionVisitId = sessionStorage.getItem(SESSION_VISIT_ID_KEY);
    } catch {
      // Ignore storage access errors
    }

    if (
      isOwnerUser ||
      isOwnerRoute ||
      isOwnerModalOpen ||
      isOwnerDevice ||
      existingSessionVisitId
    ) {
      return;
    }

    let visitorId = '';
    let isReturning = false;
    try {
      const savedVisitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
      if (savedVisitorId) {
        visitorId = savedVisitorId;
        isReturning = true;
      } else {
        visitorId = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
      }
    } catch {
      visitorId = `v-${Date.now().toString(36)}`;
    }

    const visitId = `visit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      sessionStorage.setItem(SESSION_VISIT_ID_KEY, visitId);
    } catch {
      // Ignore storage errors
    }

    void recordCustomerVisitInCloud({
      id: visitId,
      visitorId,
      isReturning,
      deviceType: detectDeviceType(),
      browser: detectBrowserName(),
      referrer: detectReferrerLabel(),
      landingPath: `${window.location.pathname || '/'}`.slice(0, 160),
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    }).catch(() => {});
  }, [authReady, user, isOwnerModalOpen]);

  const isAnyModalOpen = Boolean(
    activePolicyModal ||
      selectedProductModal ||
      isBagOpen ||
      isOwnerModalOpen,
  );

  useEffect(() => {
    if (!isAnyModalOpen) return;
    const scrollY = window.scrollY;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevScrollBehavior = document.documentElement.style.scrollBehavior;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, scrollY);
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BAG_KEY, JSON.stringify(bagItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [bagItems]);

  const isUsingDefaultCatalog = productsLoaded && cloudProducts.length === 0;
  const products =
    cloudProducts.length > 0 ? cloudProducts : INITIAL_PRODUCTS;

  const bagCount = useMemo(
    () => bagItems.reduce((sum, item) => sum + item.quantity, 0),
    [bagItems],
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const match =
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.colors.some((c) => c.name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [products, selectedCategory, searchQuery]);

  const activeModalProduct = useMemo(
    () =>
      selectedProductModal
        ? products.find((p) => p.id === selectedProductModal.productId) ?? null
        : null,
    [products, selectedProductModal],
  );

  const handleNavigateSection = (sectionId: string, category?: string) => {
    if (
      category === 'Shirts' ||
      category === 'T-Shirts' ||
      category === 'Polo T-Shirts'
    ) {
      setSelectedCategory(category);
    }
    requestAnimationFrame(() => {
      if (sectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handleFocusColors = () => {
    handleNavigateSection('collection');
  };

  const handleAddToBag = (
    product: Product,
    colorName: string,
    colorHex: string,
    previewImage: string,
    size: string,
  ) => {
    const available = getVariantStock(product, colorName, size);
    if (available <= 0) return;

    setBagItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.productId === product.id &&
          i.colorName === colorName &&
          i.size === size,
      );
      if (existing) {
        if (existing.quantity >= available) return prev;
        return prev.map((i) =>
          i.productId === product.id &&
          i.colorName === colorName &&
          i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          colorName,
          colorHex,
          previewImage,
          size,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateBagQty = (
    productId: string,
    colorName: string,
    size: string,
    delta: number,
  ) => {
    const product = products.find((p) => p.id === productId);
    const maxAvail = product ? getVariantStock(product, colorName, size) : 0;

    setBagItems((prev) =>
      prev
        .map((item) => {
          if (
            item.productId !== productId ||
            item.colorName !== colorName ||
            item.size !== size
          ) {
            return item;
          }
          const nextQty = Math.min(maxAvail, item.quantity + delta);
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveBagItem = (
    productId: string,
    colorName: string,
    size: string,
  ) => {
    setBagItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.colorName === colorName &&
            item.size === size
          ),
      ),
    );
  };

  const handleCompleteOrder = (_receipt: OrderReceipt) => {
    setBagItems([]);
  };

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#FAF8F5] text-[#1C1917] flex flex-col">
      <Header
        bagCount={bagCount}
        settings={settings}
        onNavigateSection={handleNavigateSection}
        onOpenPolicy={(tab) => setActivePolicyModal(tab)}
        onOpenBag={() => setIsBagOpen(true)}
      />

      <main className="flex-1">
        <HeroSection
          settings={settings}
          onExploreClick={() => handleNavigateSection('collection')}
        />

        {/* Men's Shirts, T-Shirts & Polo T-Shirts Collection */}
        <section
          id="collection"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 md:py-14"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6DFD3]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C6A36]">
                Men&rsquo;s Lookbook · GST-Inclusive Pricing
              </p>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#1C1917]">
                Signature Shirts, T-Shirts &amp; Polo T-Shirts
              </h2>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-[#6B655E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shirts, linen, Supima..."
                  className="w-full min-h-[44px] pl-10 pr-3.5 rounded-lg bg-white border border-[#E6DFD3] text-sm text-[#1C1917] focus:outline-none focus:border-[#144534]"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`min-h-[42px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#144534] text-white'
                        : 'bg-white text-[#6B655E] border border-[#E6DFD3] hover:border-[#144534] hover:text-[#144534]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-[#6B655E] shrink-0">
              <span className="tabular-nums">
                {filteredProducts.length} of {products.length} pieces
              </span>
              {(selectedCategory !== 'All' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 text-[#144534] font-semibold hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="mt-10 p-12 rounded-xl bg-white border border-[#E6DFD3] text-center">
              <h3 className="font-display text-2xl font-semibold text-[#1C1917]">
                No shirts or tees match your filter
              </h3>
              <p className="mt-2 text-sm text-[#6B655E]">
                Clear your filters to explore all {products.length} signature
                menswear pieces.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-5 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#144534] text-white text-sm font-medium hover:bg-[#0E3427] cursor-pointer"
              >
                Show All Menswear
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={(p, colorName) =>
                    setSelectedProductModal({
                      productId: p.id,
                      colorName,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>

        <AtelierStory
          settings={settings}
          onOpenPolicy={(tab) => setActivePolicyModal(tab)}
          onOpenOwnerBackend={() => setIsOwnerModalOpen(true)}
        />
      </main>

      <MobileTabBar
        bagCount={bagCount}
        onSelectShop={() => handleNavigateSection('top')}
        onFocusColors={handleFocusColors}
        onSelectPolicies={() => setActivePolicyModal('delivery')}
        onOpenBag={() => setIsBagOpen(true)}
      />

      <ProductDetailSheet
        product={activeModalProduct}
        initialColorName={selectedProductModal?.colorName}
        bagItems={bagItems}
        bagCount={bagCount}
        onClose={() => setSelectedProductModal(null)}
        onAddToBag={handleAddToBag}
        onGoToCart={() => {
          setSelectedProductModal(null);
          setIsBagOpen(true);
        }}
      />

      <PolicyModal
        activePolicy={activePolicyModal}
        settings={settings}
        onSelectPolicy={(tab) => setActivePolicyModal(tab)}
        onClose={() => setActivePolicyModal(null)}
      />

      <OwnerBackendModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        user={user}
        cloudProducts={products}
        isUsingDefaultCatalog={isUsingDefaultCatalog}
        settings={settings}
      />

      <BagDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        bagItems={bagItems}
        products={products}
        settings={settings}
        onUpdateQuantity={handleUpdateBagQty}
        onRemoveItem={handleRemoveBagItem}
        onCompleteOrder={handleCompleteOrder}
      />
    </div>
  );
}
