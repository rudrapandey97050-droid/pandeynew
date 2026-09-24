import React from 'react';
import { Product, StoreSettings } from '../types.ts';
import { ProductCard } from './ProductCard.tsx';
import { AppleShowcaseBanner } from './AppleShowcaseBanner.tsx';
import { Smartphone, RefreshCw, ShoppingBag, Search } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary.tsx';

interface ProductSectionProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectProduct: (p: Product) => void;
  onExchangeWithThis: (p: Product) => void;
  onOrderProduct: (p: Product) => void;
  searchQuery: string;
  storeSettings?: StoreSettings;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onExchangeWithThis,
  onOrderProduct,
  searchQuery,
  storeSettings
}) => {
  const [inStockOnly, setInStockOnly] = React.useState(false);

  const isProductAvailable = (p: Product) => {
    if (p.availability === 'Out of Stock' || p.availability === 'Sold Out') return false;
    if (p.availability === 'In Stock' || p.availability === 'Available' || p.availability === 'Limited Stock') return true;
    return (p.stock ?? 5) > 0;
  };

  // Only display visible products
  const visibleProducts = products.filter(p => !p.isHidden);
  const inStockCount = visibleProducts.filter(isProductAvailable).length;

  const filteredProducts = visibleProducts.filter(p => {
    // In-Stock Only filter
    if (inStockOnly && !isProductAvailable(p)) {
      return false;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.model && p.model.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.storage && p.storage.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Category
    if (selectedCategory === 'all' || selectedCategory === 'All') return true;
    if (selectedCategory === 'Android') {
      return p.brand.toLowerCase() !== 'apple' && p.category.toLowerCase() !== 'iphone';
    }
    if (selectedCategory === 'Pre-Owned' || selectedCategory === 'Used') {
      return p.condition === 'Used' || p.condition === 'Pre-Owned' || p.condition === 'Refurbished';
    }
    if (selectedCategory === 'Apple' || selectedCategory === 'iPhone') {
      return p.brand.toLowerCase() === 'apple' || p.category.toLowerCase() === 'iphone';
    }
    if (selectedCategory === 'Redmi' || selectedCategory === 'Xiaomi') {
      return p.brand.toLowerCase() === 'redmi' || p.brand.toLowerCase() === 'xiaomi' || p.category.toLowerCase() === 'xiaomi';
    }
    
    return p.brand.toLowerCase() === selectedCategory.toLowerCase() || p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'all':
      case 'All': return 'All Available Smartphones';
      case 'Android': return 'Android Smartphone Collection';
      case 'Apple':
      case 'iPhone': return 'Apple iPhone Collection';
      case 'Samsung': return 'Samsung Galaxy Collection';
      case 'Vivo': return 'Vivo Smartphone Collection';
      case 'POCO': return 'POCO Smartphone Collection';
      case 'HONOR': return 'HONOR Smartphone Collection';
      case 'Redmi':
      case 'Xiaomi': return 'Redmi & Xiaomi Collection';
      case 'Pre-Owned':
      case 'Used': return 'Certified Pre-Owned & Used Phones';
      default: return `${selectedCategory} Collection`;
    }
  };

  const showAppleShowcase = selectedCategory === 'all' || selectedCategory === 'Apple' || selectedCategory === 'iPhone';

  return (
    <section id="products-section" className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Apple Showcase Banner (When Apple or All is active and no active search filter) */}
        {showAppleShowcase && !searchQuery.trim() && (
          <ErrorBoundary name="AppleShowcaseBanner">
            <AppleShowcaseBanner
              products={products}
              onSelectProduct={onSelectProduct}
              storeSettings={storeSettings}
            />
          </ErrorBoundary>
        )}

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Smartphone className="w-4 h-4" />
              <span>Available Inventory at Traffic Chowk</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              {getCategoryTitle()}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-xs ${
                inStockOnly
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
              <span>{inStockOnly ? 'स्टक उपलब्ध मात्र (In Stock Only)' : 'स्टक भएका मात्र देखाउनुहोस्'}</span>
            </button>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span><strong>{filteredProducts.length}</strong> devices</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{inStockCount} In Stock</span>
            </div>
          </div>
        </div>

        {/* Global Empty State: No products available in store */}
        {visibleProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-black text-slate-900 font-serif">No products available</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                There are currently no phones listed in our storefront catalog. New inventory and latest smartphones are added directly from the store Admin Panel.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="px-3 py-1 bg-slate-100 rounded-full font-medium">📍 {storeSettings?.address || 'Traffic Chowk'}, {storeSettings?.city || 'Butwal'}</span>
              <span className="px-3 py-1 bg-slate-100 rounded-full font-medium">📞 {storeSettings?.phone1 || '9847460603'}</span>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Filtered empty state (Search / Category filter yielded no match) */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Smartphones Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any phone matching {searchQuery ? `"${searchQuery}"` : 'the selected category'}. Try choosing a different brand or clearing filters.
            </p>
            <button
              onClick={() => {
                onSelectCategory('all');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              View All Available Devices
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelectProduct={onSelectProduct}
                onExchangeWithThis={onExchangeWithThis}
                onOrderProduct={onOrderProduct}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
