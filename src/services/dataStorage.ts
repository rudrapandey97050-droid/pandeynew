import {
  Product,
  ProductAvailability,
  RateListItem,
  RepairBooking,
  CustomerOrder,
  PhoneValuationRequest,
  StoreSettings,
  ValuationStatus,
  UpcomingModel,
  PreBookingRequest,
  PopupSettings,
  PreBookingStatus,
  FullAppBackupData,
  RestoreResult,
  CustomerReview
} from '../types.ts';
import { initialProducts } from '../data/products.ts';
import { initialUsedIPhoneRateList } from '../data/nepalPriceList.ts';
import { initialStoreSettings } from '../data/storeSettings.ts';
import { initialUpcomingModels, initialPopupSettings } from '../data/upcomingModels.ts';
import { initialCustomerReviews } from '../data/initialReviews.ts';
import { FirestoreService } from './firestoreService.ts';

const STORAGE_KEYS = {
  PRODUCTS: 'pms_products_v2',
  RATE_LIST: 'pms_rate_list_v2',
  VALUATIONS: 'pms_valuations_v2',
  REPAIR_BOOKINGS: 'pms_repair_bookings_v2',
  ORDERS: 'pms_orders_v2',
  STORE_SETTINGS: 'pms_store_settings_v2',
  ADMIN_AUTH: 'pms_admin_auth_v2',
  UPCOMING_MODELS: 'pms_upcoming_models_v1',
  PRE_BOOKINGS: 'pms_pre_bookings_v1',
  POPUP_SETTINGS: 'pms_popup_settings_v1',
  POPUP_DISMISSED: 'pms_popup_dismissed_session_v1',
  CUSTOMER_REVIEWS: 'pms_customer_reviews_v1',
  LAST_SYNC: 'pms_last_sync_timestamp'
};

let storeBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    storeBroadcastChannel = new BroadcastChannel('pms_store_broadcast');
  }
} catch (e) {
  // Gracefully fallback if unsupported
}

function notifyDataChange(keyName: string) {
  if (typeof window === 'undefined') return;
  try {
    const timestamp = Date.now();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    window.dispatchEvent(new CustomEvent('pms_data_sync', { detail: { key: keyName, timestamp } }));
    if (storeBroadcastChannel) {
      storeBroadcastChannel.postMessage({ key: keyName, timestamp });
    }
  } catch (err) {
    // Ignore storage quota or cross-origin restrictions
  }
}

export class DataStorageService {
  /**
   * Subscribe to live data updates across all open tabs, windows, and views
   */
  static subscribeToUpdates(callback: (changedKey?: string) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleCustomSync = (e: any) => {
      callback(e?.detail?.key);
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('pms_') || e.key === STORAGE_KEYS.LAST_SYNC)) {
        callback(e.key);
      }
    };

    const handleBroadcastMsg = (e: MessageEvent) => {
      callback(e?.data?.key);
    };

    window.addEventListener('pms_data_sync', handleCustomSync);
    window.addEventListener('storage', handleStorageEvent);
    if (storeBroadcastChannel) {
      storeBroadcastChannel.addEventListener('message', handleBroadcastMsg);
    }

    return () => {
      window.removeEventListener('pms_data_sync', handleCustomSync);
      window.removeEventListener('storage', handleStorageEvent);
      if (storeBroadcastChannel) {
        storeBroadcastChannel.removeEventListener('message', handleBroadcastMsg);
      }
    };
  }

  // Products (Initialized with official iPhone lineup & fully editable/controllable by Admin)
  static getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Synchronize stock count with visitor availability:
          // Stock in account > 0 => In Stock / Limited Stock; Stock <= 0 => Out of Stock
          return parsed.map(p => {
            const stock = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
            const availability: ProductAvailability = p.availability === 'Pre-Order'
              ? 'Pre-Order'
              : (stock > 0 ? (stock <= 2 ? 'Limited Stock' : 'In Stock') : 'Out of Stock');
            return {
              ...p,
              stock,
              availability
            };
          });
        }
      }
    } catch (e) {
      console.error('Error reading products from storage', e);
    }
    // Only initialize with official Apple lineup if key has NEVER been set
    const initialWithStock: Product[] = initialProducts.map(p => {
      const stock = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
      const availability: ProductAvailability = p.availability === 'Pre-Order'
        ? 'Pre-Order'
        : (stock > 0 ? (stock <= 2 ? 'Limited Stock' : 'In Stock') : 'Out of Stock');
      return {
        ...p,
        stock,
        availability
      };
    });
    this.saveProducts(initialWithStock);
    return initialWithStock;
  }

  static saveProducts(products: Product[]): void {
    try {
      const synced: Product[] = products.map(p => {
        const stock = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
        const availability: ProductAvailability = p.availability === 'Pre-Order'
          ? 'Pre-Order'
          : (stock > 0 ? (stock <= 2 ? 'Limited Stock' : 'In Stock') : 'Out of Stock');
        return {
          ...p,
          stock,
          availability
        };
      });
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(synced));
      notifyDataChange('products');
    } catch (e) {
      console.error('Error saving products', e);
    }
  }

  static updateProductStock(id: string, newStock: number): Product | null {
    const stock = Math.max(0, newStock);
    const availability = stock > 0 ? (stock <= 2 ? 'Limited Stock' : 'In Stock') : 'Out of Stock';
    return this.updateProduct(id, { stock, availability });
  }

  static clearAllProducts(): void {
    this.saveProducts([]);
  }

  static removePreOwnedProducts(): void {
    const products = this.getProducts();
    const filtered = products.filter(p => p.condition !== 'Pre-Owned' && p.condition !== 'Used');
    this.saveProducts(filtered);
  }

  static resetToAppleLineup(): Product[] {
    this.saveProducts(initialProducts);
    return initialProducts;
  }

  static updateProductRate(id: string, newPrice: number, originalPrice?: number, variants?: any[]): Product | null {
    const updates: Partial<Product> = { price: newPrice };
    if (originalPrice !== undefined) updates.originalPrice = originalPrice;
    if (variants !== undefined) updates.variants = variants;
    return this.updateProduct(id, updates);
  }

  static addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const timestamp = Date.now();
    const newProduct: Product = {
      ...productData,
      id: `pms-prod-${timestamp}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    this.saveProducts(products);
    FirestoreService.saveProduct(newProduct).catch(() => {});
    return newProduct;
  }

  static updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updated: Product = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    products[index] = updated;
    this.saveProducts(products);
    FirestoreService.saveProduct(updated).catch(() => {});
    return updated;
  }

  static deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    this.saveProducts(filtered);
    FirestoreService.deleteProduct(id).catch(() => {});
    return true;
  }

  static toggleProductVisibility(id: string): boolean {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    products[index].isHidden = !products[index].isHidden;
    products[index].updatedAt = new Date().toISOString();
    this.saveProducts(products);
    return true;
  }

  static toggleProductLineup(id: string): boolean {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    const current = !!products[index].isLineupItem;
    products[index].isLineupItem = !current;
    if (!products[index].isLineupItem && products[index].isLineupHero) {
      products[index].isLineupHero = false;
    }
    products[index].updatedAt = new Date().toISOString();
    this.saveProducts(products);
    return true;
  }

  static setProductLineupHero(id: string): boolean {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    products.forEach(p => {
      p.isLineupHero = (p.id === id);
      if (p.id === id) {
        p.isLineupItem = true;
      }
    });

    // Also persist in StoreSettings
    try {
      const settings = this.getStoreSettings();
      settings.lineupHeroProductId = id;
      this.saveStoreSettings(settings);
    } catch (e) {
      // Ignore
    }

    this.saveProducts(products);
    return true;
  }

  static updateLineupOrder(orderedIds: string[]): Product[] {
    const products = this.getProducts();
    products.forEach(p => {
      const idx = orderedIds.indexOf(p.id);
      if (idx !== -1) {
        p.isLineupItem = true;
        p.lineupOrder = idx + 1;
      }
    });
    this.saveProducts(products);
    return products;
  }

  // Rate List
  static getManualRateList(): RateListItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATE_LIST);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading rate list', e);
    }
    this.saveRateList(initialUsedIPhoneRateList);
    return initialUsedIPhoneRateList;
  }

  static getRateList(): RateListItem[] {
    const manualItems = this.getManualRateList();
    const products = this.getProducts();

    // Map all store products (smartphones, accessories) into Rate List items
    const productRateItems: RateListItem[] = products
      .filter(p => !p.isHidden)
      .map(p => {
        const isPreOwned = p.condition === 'Used' || p.condition === 'Pre-Owned' || p.condition === 'Refurbished';
        const isAccessory = 
          p.category?.toLowerCase() === 'accessories' || 
          p.category?.toLowerCase() === 'accessory' ||
          p.brand?.toLowerCase() === 'accessories' ||
          p.brand?.toLowerCase() === 'accessory' ||
          (!p.ram && !p.storage && !p.batteryHealth && (
            p.name.toLowerCase().includes('case') || 
            p.name.toLowerCase().includes('charger') || 
            p.name.toLowerCase().includes('cable') || 
            p.name.toLowerCase().includes('airpod') || 
            p.name.toLowerCase().includes('buds') || 
            p.name.toLowerCase().includes('adapter') || 
            p.name.toLowerCase().includes('cover') || 
            p.name.toLowerCase().includes('guard') || 
            p.name.toLowerCase().includes('power bank') ||
            p.name.toLowerCase().includes('watch')
          ));

        return {
          id: `prod-${p.id}`,
          model: p.name || p.model || 'Device',
          brand: p.brand || 'Apple',
          category: isAccessory ? 'Accessories' : 'Smartphone',
          storage: p.storage || (isAccessory ? 'Standard' : '-'),
          condition: isPreOwned ? (p.conditionGrade || 'Pre-Owned') : 'New',
          batteryHealth: p.batteryHealth,
          sellingPrice: p.price,
          marketPrice: p.originalPrice,
          warranty: p.warranty || (isPreOwned ? '15 Days Store Warranty' : '1 Year Official Brand Warranty'),
          status: p.availability || 'In Stock',
          image: p.image,
          updatedAt: p.updatedAt ? p.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });

    // Tag manual items with categories and standard properties
    const taggedManualItems: RateListItem[] = manualItems.map(item => ({
      ...item,
      category: item.category || 'Smartphone',
      condition: item.condition || 'Pre-Owned',
      storage: item.storage || '-'
    }));

    // Combine while avoiding exact duplicate items
    const combined = [...taggedManualItems];
    for (const pItem of productRateItems) {
      const alreadyInList = combined.some(m => 
        m.id === pItem.id || 
        (m.model.toLowerCase().trim() === pItem.model.toLowerCase().trim() &&
         (m.storage || '').toLowerCase().trim() === (pItem.storage || '').toLowerCase().trim() &&
         (m.condition.toLowerCase().includes('new') === pItem.condition.toLowerCase().includes('new')))
      );
      if (!alreadyInList) {
        combined.push(pItem);
      }
    }

    return combined;
  }

  static saveRateList(items: RateListItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RATE_LIST, JSON.stringify(items));
      notifyDataChange('ratelist');
    } catch (e) {
      console.error('Error saving rate list', e);
    }
  }

  // Store Settings
  static getStoreSettings(): StoreSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORE_SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        let modified = false;
        if (!parsed.technicianPhone || parsed.technicianPhone === '9857039988') {
          parsed.technicianPhone = '9847460603';
          modified = true;
        }
        if (parsed.phone1 === '9857039988') {
          parsed.phone1 = '9847460603';
          modified = true;
        }
        if (parsed.whatsapp === '9857039988') {
          parsed.whatsapp = '9847460603';
          modified = true;
        }
        if (modified) {
          try {
            localStorage.setItem(STORAGE_KEYS.STORE_SETTINGS, JSON.stringify(parsed));
          } catch (e) {
            // ignore
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error reading store settings', e);
    }
    this.saveStoreSettings(initialStoreSettings);
    return initialStoreSettings;
  }

  static saveStoreSettings(settings: StoreSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE_SETTINGS, JSON.stringify(settings));
      notifyDataChange('storesettings');
      FirestoreService.saveStoreSettings(settings).catch(() => {});
    } catch (e) {
      console.error('Error saving store settings', e);
    }
  }

  // Mobile Valuations & Exchange
  static getValuations(): PhoneValuationRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VALUATIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading valuations', e);
    }
    // No demo valuation data by requirement!
    return [];
  }

  static getValuationRequests(): PhoneValuationRequest[] {
    return this.getValuations();
  }

  static saveValuations(valuations: PhoneValuationRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VALUATIONS, JSON.stringify(valuations));
      notifyDataChange('valuations');
    } catch (e) {
      console.error('Error saving valuations', e);
    }
  }

  static addValuation(request: Omit<PhoneValuationRequest, 'id' | 'valuationId' | 'status' | 'createdAt' | 'updatedAt'>): PhoneValuationRequest {
    const valuations = this.getValuations();
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const valuationId = `PMS-VAL-${new Date().getFullYear()}-${randomSuffix}`;
    
    const newRecord: PhoneValuationRequest = {
      ...request,
      id: `val_${timestamp}_${randomSuffix}`,
      valuationId,
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    valuations.unshift(newRecord);
    this.saveValuations(valuations);
    FirestoreService.saveValuation(newRecord).catch(() => {});
    return newRecord;
  }

  static updateValuation(id: string, updates: Partial<PhoneValuationRequest>): PhoneValuationRequest | null {
    const valuations = this.getValuations();
    const index = valuations.findIndex(v => v.id === id);
    if (index === -1) return null;

    const updated = {
      ...valuations[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    valuations[index] = updated;
    this.saveValuations(valuations);
    FirestoreService.saveValuation(updated).catch(() => {});
    return updated;
  }

  static deleteValuation(id: string): boolean {
    const valuations = this.getValuations();
    const filtered = valuations.filter(v => v.id !== id);
    if (filtered.length === valuations.length) return false;
    this.saveValuations(filtered);
    return true;
  }

  // Repair Bookings
  static getRepairBookings(): RepairBooking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPAIR_BOOKINGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading repair bookings', e);
    }
    return [];
  }

  static saveRepairBookings(bookings: RepairBooking[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REPAIR_BOOKINGS, JSON.stringify(bookings));
      notifyDataChange('repairs');
    } catch (e) {
      console.error('Error saving repair bookings', e);
    }
  }

  static addRepairBooking(booking: Partial<RepairBooking> & {
    customerName: string;
    phoneNumber: string;
    mobileBrand: string;
    mobileModel: string;
    problemType: string;
    problemDescription: string;
    preferredDate: string;
    preferredTime: string;
  }): RepairBooking {
    const bookings = this.getRepairBookings();
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `PMS-REP-${new Date().getFullYear()}-${randomSuffix}`;

    const newBooking: RepairBooking = {
      id: `rep_${timestamp}_${randomSuffix}`,
      bookingCode,
      customerName: booking.customerName,
      phoneNumber: booking.phoneNumber,
      customerAddress: booking.customerAddress,
      alternatePhone: booking.alternatePhone,
      mobileBrand: booking.mobileBrand || 'Other',
      mobileModel: booking.mobileModel || booking.phoneModel || '',
      imeiOrSerial: booking.imeiOrSerial,
      devicePasscode: booking.devicePasscode,
      accessoriesReceived: booking.accessoriesReceived,
      physicalCondition: booking.physicalCondition,
      problemType: booking.problemType || booking.issueType || 'General Repair',
      problemDescription: booking.problemDescription || booking.description || '',
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
      deliveryDate: booking.deliveryDate,
      photo: booking.photo,
      status: (booking.status as any) || 'New',
      tentativePrice: booking.tentativePrice ?? booking.estimatedCost,
      advancePaid: booking.advancePaid,
      finalPrice: booking.finalPrice,
      notes: booking.notes,
      technicianName: booking.technicianName,
      technicianPhone: booking.technicianPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Backward compatibility aliases
      phoneModel: booking.mobileModel,
      issueType: booking.problemType,
      description: booking.problemDescription
    };

    bookings.unshift(newBooking);
    this.saveRepairBookings(bookings);
    FirestoreService.saveRepairBooking(newBooking).catch(() => {});
    return newBooking;
  }

  static updateRepairBooking(id: string, updates: Partial<RepairBooking>): RepairBooking | null {
    const bookings = this.getRepairBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;

    const current = bookings[index];
    const updated: RepairBooking = {
      ...current,
      ...updates,
      // Keep aliases in sync
      phoneModel: updates.mobileModel ?? current.mobileModel,
      issueType: updates.problemType ?? current.problemType,
      description: updates.problemDescription ?? current.problemDescription,
      updatedAt: new Date().toISOString()
    };

    bookings[index] = updated;
    this.saveRepairBookings(bookings);
    FirestoreService.saveRepairBooking(updated).catch(() => {});
    return updated;
  }

  static updateRepairBookingStatus(id: string, status: RepairBooking['status'], notes?: string): void {
    const bookings = this.getRepairBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = status;
      if (notes !== undefined) bookings[index].notes = notes;
      bookings[index].updatedAt = new Date().toISOString();
      this.saveRepairBookings(bookings);
    }
  }

  static deleteRepairBooking(id: string): boolean {
    const bookings = this.getRepairBookings();
    const filtered = bookings.filter(b => b.id !== id);
    if (filtered.length === bookings.length) return false;
    this.saveRepairBookings(filtered);
    return true;
  }

  static findRepairBookingsByQuery(query: string): RepairBooking[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    const digitsOnly = clean.replace(/\D/g, '');
    const bookings = this.getRepairBookings();
    return bookings.filter(b => {
      const codeMatch = b.bookingCode?.toLowerCase().includes(clean);
      const idMatch = b.id?.toLowerCase().includes(clean);
      const phoneDigits = b.phoneNumber?.replace(/\D/g, '') || '';
      const phoneMatch = digitsOnly.length >= 4 && phoneDigits.includes(digitsOnly);
      const nameMatch = b.customerName?.toLowerCase().includes(clean);
      const modelMatch = b.mobileModel?.toLowerCase().includes(clean);
      return codeMatch || idMatch || phoneMatch || nameMatch || modelMatch;
    });
  }

  static getRepairBookingByCode(code: string): RepairBooking | undefined {
    const clean = code.trim().toLowerCase();
    if (!clean) return undefined;
    const bookings = this.getRepairBookings();
    return bookings.find(b => 
      b.bookingCode?.toLowerCase() === clean || 
      b.id?.toLowerCase() === clean
    );
  }

  // Orders
  static getOrders(): CustomerOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading orders', e);
    }
    return [];
  }

  static saveOrders(orders: CustomerOrder[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders', e);
    }
  }

  static addOrder(order: Omit<CustomerOrder, 'id' | 'orderNumber' | 'status' | 'createdAt'>): CustomerOrder {
    const orders = this.getOrders();
    const orderNumber = `PMS-ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: CustomerOrder = {
      ...order,
      id: `ord_${Date.now()}`,
      orderNumber,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    orders.unshift(newOrder);
    this.saveOrders(orders);
    FirestoreService.saveOrder(newOrder).catch(() => {});
    return newOrder;
  }

  // Admin Auth State
  static isAdminAuthenticated(): boolean {
    try {
      const session = localStorage.getItem('pms_admin_session_v3');
      if (!session) return false;
      const parsed = JSON.parse(session);
      return !!parsed && !!parsed.token;
    } catch {
      return false;
    }
  }

  static setAdminAuthenticated(auth: boolean): void {
    try {
      if (!auth) {
        localStorage.removeItem('pms_admin_session_v3');
        localStorage.removeItem('pms_admin_auth_v2');
      }
    } catch (e) {
      console.error('Error updating admin auth state', e);
    }
  }

  // UPCOMING MODELS
  static getUpcomingModels(): UpcomingModel[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UPCOMING_MODELS);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingSlugs = new Set(parsed.map((p: UpcomingModel) => p.slug));
          const toAdd = initialUpcomingModels.filter(m => !existingSlugs.has(m.slug) && !parsed.some((p: UpcomingModel) => p.id === m.id));
          if (toAdd.length > 0) {
            const merged = [...parsed, ...toAdd];
            this.saveUpcomingModels(merged);
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading upcoming models', e);
    }
    this.saveUpcomingModels(initialUpcomingModels);
    return initialUpcomingModels;
  }

  static saveUpcomingModels(models: UpcomingModel[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.UPCOMING_MODELS, JSON.stringify(models));
      notifyDataChange('upcoming');
    } catch (e) {
      console.error('Error saving upcoming models', e);
    }
  }

  static getUpcomingModelBySlug(slug: string): UpcomingModel | undefined {
    const models = this.getUpcomingModels();
    return models.find(m => m.slug.toLowerCase() === slug.toLowerCase() || m.id === slug);
  }

  static addUpcomingModel(modelData: Omit<UpcomingModel, 'id' | 'createdAt' | 'updatedAt'>): UpcomingModel {
    const models = this.getUpcomingModels();
    const timestamp = Date.now();
    const slug = modelData.slug?.trim() || modelData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const newModel: UpcomingModel = {
      ...modelData,
      slug,
      id: `up-${timestamp}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    models.unshift(newModel);
    this.saveUpcomingModels(models);
    return newModel;
  }

  static updateUpcomingModel(id: string, updates: Partial<UpcomingModel>): UpcomingModel | null {
    const models = this.getUpcomingModels();
    const index = models.findIndex(m => m.id === id);
    if (index === -1) return null;

    const updated: UpcomingModel = {
      ...models[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    models[index] = updated;
    this.saveUpcomingModels(models);
    return updated;
  }

  static deleteUpcomingModel(id: string): boolean {
    const models = this.getUpcomingModels();
    const filtered = models.filter(m => m.id !== id);
    if (filtered.length === models.length) return false;
    this.saveUpcomingModels(filtered);
    return true;
  }

  // PRE-BOOKING REQUESTS
  static getPreBookings(): PreBookingRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRE_BOOKINGS);
      if (data !== null) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading pre-bookings', e);
    }
    return [];
  }

  static savePreBookings(bookings: PreBookingRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRE_BOOKINGS, JSON.stringify(bookings));
    } catch (e) {
      console.error('Error saving pre-bookings', e);
    }
  }

  static addPreBooking(data: Omit<PreBookingRequest, 'id' | 'bookingCode' | 'status' | 'createdAt' | 'updatedAt'>): PreBookingRequest {
    const bookings = this.getPreBookings();
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `PMS-PB-${new Date().getFullYear()}-${randomSuffix}`;
    
    const newBooking: PreBookingRequest = {
      ...data,
      id: `pb-${timestamp}`,
      bookingCode,
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    bookings.unshift(newBooking);
    this.savePreBookings(bookings);
    FirestoreService.savePreBooking(newBooking).catch(() => {});
    return newBooking;
  }

  static updatePreBookingStatus(id: string, status: PreBookingStatus, adminNotes?: string): PreBookingRequest | null {
    const bookings = this.getPreBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;

    const updated: PreBookingRequest = {
      ...bookings[index],
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      updatedAt: new Date().toISOString()
    };
    bookings[index] = updated;
    this.savePreBookings(bookings);
    FirestoreService.savePreBooking(updated).catch(() => {});
    return updated;
  }

  static deletePreBooking(id: string): boolean {
    const bookings = this.getPreBookings();
    const filtered = bookings.filter(b => b.id !== id);
    if (filtered.length === bookings.length) return false;
    this.savePreBookings(filtered);
    return true;
  }

  // POPUP SETTINGS
  static getPopupSettings(): PopupSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POPUP_SETTINGS);
      if (data !== null) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading popup settings', e);
    }
    this.savePopupSettings(initialPopupSettings);
    return initialPopupSettings;
  }

  static savePopupSettings(settings: PopupSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.POPUP_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving popup settings', e);
    }
  }

  // POPUP DISMISSAL SESSION TRACKING
  static isPopupDismissed(): boolean {
    try {
      // Check session or 24-hour dismissal token in localStorage
      const timestamp = localStorage.getItem(STORAGE_KEYS.POPUP_DISMISSED);
      if (!timestamp) return false;
      const dismissedTime = parseInt(timestamp, 10);
      // Suppress for 24 hours (or current session)
      const now = Date.now();
      if (now - dismissedTime < 24 * 60 * 60 * 1000) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  static setPopupDismissed(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.POPUP_DISMISSED, Date.now().toString());
    } catch (e) {
      console.error('Error setting popup dismissed', e);
    }
  }

  static resetPopupDismissed(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.POPUP_DISMISSED);
    } catch (e) {
      console.error('Error resetting popup dismissed', e);
    }
  }

  // ==========================================
  // CUSTOMER REVIEWS & TESTIMONIALS
  // ==========================================
  static getCustomerReviews(): CustomerReview[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REVIEWS);
      if (!stored) {
        this.saveCustomerReviews(initialCustomerReviews);
        return initialCustomerReviews;
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialCustomerReviews;
    } catch (e) {
      console.error('Error reading customer reviews', e);
      return initialCustomerReviews;
    }
  }

  static saveCustomerReviews(reviews: CustomerReview[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_REVIEWS, JSON.stringify(reviews));
      notifyDataChange('reviews');
    } catch (e) {
      console.error('Error saving customer reviews', e);
    }
  }

  static addCustomerReview(review: Omit<CustomerReview, 'id' | 'createdAt'>): CustomerReview {
    const reviews = this.getCustomerReviews();
    const id = `rev_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: CustomerReview = {
      ...review,
      id,
      createdAt: new Date().toISOString()
    };
    reviews.unshift(newRecord);
    this.saveCustomerReviews(reviews);
    FirestoreService.saveCustomerReview(newRecord).catch(() => {});
    return newRecord;
  }


  // ==========================================
  // ONE-CLICK ALL BACKUP & RESTORE ENGINE
  // ==========================================

  /**
   * Generates a complete snapshot of all store data, settings, catalogs, bookings, and inquiries.
   */
  static exportAllData(): FullAppBackupData {
    const products = this.getProducts();
    const rateList = this.getRateList();
    const valuations = this.getValuationRequests();
    const repairBookings = this.getRepairBookings();
    const orders = this.getOrders();
    const storeSettings = this.getStoreSettings();
    const upcomingModels = this.getUpcomingModels();
    const preBookings = this.getPreBookings();
    const popupSettings = this.getPopupSettings();

    const backup: FullAppBackupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      appName: 'Pandey Mobile Store, Butwal',
      summary: {
        productsCount: products.length,
        rateListCount: rateList.length,
        valuationsCount: valuations.length,
        repairBookingsCount: repairBookings.length,
        upcomingModelsCount: upcomingModels.length,
        preBookingsCount: preBookings.length,
        hasStoreSettings: !!storeSettings,
        hasPopupSettings: !!popupSettings
      },
      data: {
        products,
        rateList,
        valuations,
        repairBookings,
        orders,
        storeSettings,
        upcomingModels,
        preBookings,
        popupSettings
      }
    };

    return backup;
  }

  /**
   * Triggers a one-click browser download of the complete JSON backup file.
   */
  static downloadBackupFile(): { filename: string; sizeKb: number; timestamp: string } {
    const backup = this.exportAllData();
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    
    // Generate clean dated filename e.g. pandey-mobile-backup-2026-09-15_18-45.json
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const filename = `pandey-mobile-backup-${dateStr}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      filename,
      sizeKb: Math.round((blob.size / 1024) * 10) / 10,
      timestamp: backup.exportedAt
    };
  }

  /**
   * Copies formatted JSON backup data to clipboard.
   */
  static async copyBackupToClipboard(): Promise<boolean> {
    try {
      const backup = this.exportAllData();
      const jsonString = JSON.stringify(backup, null, 2);
      await navigator.clipboard.writeText(jsonString);
      return true;
    } catch (e) {
      console.error('Error copying backup to clipboard', e);
      return false;
    }
  }

  /**
   * Validates a backup JSON string or object before restoring.
   */
  static validateBackupPayload(rawInput: string | object): {
    valid: boolean;
    error?: string;
    backup?: FullAppBackupData;
  } {
    try {
      let parsed: any;
      if (typeof rawInput === 'string') {
        parsed = JSON.parse(rawInput);
      } else {
        parsed = rawInput;
      }

      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Invalid file format. Expected a valid JSON object.' };
      }

      // Check if it's the standard structured backup format
      if (parsed.data && typeof parsed.data === 'object') {
        const data = parsed.data;
        if (!Array.isArray(data.products) && !Array.isArray(data.rateList) && !data.storeSettings) {
          return { valid: false, error: 'The backup file is missing required Pandey Store data sections.' };
        }

        const normalized: FullAppBackupData = {
          version: parsed.version || '2.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          appName: parsed.appName || 'Pandey Mobile Store',
          summary: {
            productsCount: Array.isArray(data.products) ? data.products.length : 0,
            rateListCount: Array.isArray(data.rateList) ? data.rateList.length : 0,
            valuationsCount: Array.isArray(data.valuations) ? data.valuations.length : 0,
            repairBookingsCount: Array.isArray(data.repairBookings) ? data.repairBookings.length : 0,
            upcomingModelsCount: Array.isArray(data.upcomingModels) ? data.upcomingModels.length : 0,
            preBookingsCount: Array.isArray(data.preBookings) ? data.preBookings.length : 0,
            hasStoreSettings: !!data.storeSettings,
            hasPopupSettings: !!data.popupSettings
          },
          data: {
            products: Array.isArray(data.products) ? data.products : [],
            rateList: Array.isArray(data.rateList) ? data.rateList : [],
            valuations: Array.isArray(data.valuations) ? data.valuations : [],
            repairBookings: Array.isArray(data.repairBookings) ? data.repairBookings : [],
            orders: Array.isArray(data.orders) ? data.orders : [],
            storeSettings: data.storeSettings || initialStoreSettings,
            upcomingModels: Array.isArray(data.upcomingModels) ? data.upcomingModels : [],
            preBookings: Array.isArray(data.preBookings) ? data.preBookings : [],
            popupSettings: data.popupSettings || initialPopupSettings
          }
        };

        return { valid: true, backup: normalized };
      }

      // Fallback: Check if it's a flat raw dump
      if (Array.isArray(parsed.products) || Array.isArray(parsed.rateList)) {
        const normalized: FullAppBackupData = {
          version: '1.0-flat',
          exportedAt: new Date().toISOString(),
          appName: 'Pandey Mobile Store',
          summary: {
            productsCount: Array.isArray(parsed.products) ? parsed.products.length : 0,
            rateListCount: Array.isArray(parsed.rateList) ? parsed.rateList.length : 0,
            valuationsCount: Array.isArray(parsed.valuations) ? parsed.valuations.length : 0,
            repairBookingsCount: Array.isArray(parsed.repairBookings) ? parsed.repairBookings.length : 0,
            upcomingModelsCount: Array.isArray(parsed.upcomingModels) ? parsed.upcomingModels.length : 0,
            preBookingsCount: Array.isArray(parsed.preBookings) ? parsed.preBookings.length : 0,
            hasStoreSettings: !!parsed.storeSettings,
            hasPopupSettings: !!parsed.popupSettings
          },
          data: {
            products: Array.isArray(parsed.products) ? parsed.products : [],
            rateList: Array.isArray(parsed.rateList) ? parsed.rateList : [],
            valuations: Array.isArray(parsed.valuations) ? parsed.valuations : [],
            repairBookings: Array.isArray(parsed.repairBookings) ? parsed.repairBookings : [],
            orders: Array.isArray(parsed.orders) ? parsed.orders : [],
            storeSettings: parsed.storeSettings || initialStoreSettings,
            upcomingModels: Array.isArray(parsed.upcomingModels) ? parsed.upcomingModels : [],
            preBookings: Array.isArray(parsed.preBookings) ? parsed.preBookings : [],
            popupSettings: parsed.popupSettings || initialPopupSettings
          }
        };
        return { valid: true, backup: normalized };
      }

      return {
        valid: false,
        error: 'Unrecognized backup format. Please ensure you are restoring a Pandey Mobile Store JSON backup file.'
      };
    } catch (e: any) {
      return { valid: false, error: `JSON Parse Error: ${e.message || 'Invalid JSON format.'}` };
    }
  }

  /**
   * One-click restore all data into the application.
   */
  static restoreAllData(backup: FullAppBackupData, mode: 'replace' | 'merge' = 'replace'): RestoreResult {
    const stats = {
      products: 0,
      rateList: 0,
      valuations: 0,
      repairBookings: 0,
      upcomingModels: 0,
      preBookings: 0,
      storeSettingsRestored: false,
      popupSettingsRestored: false
    };

    const bData = backup.data;

    if (mode === 'replace') {
      // 1. Products
      if (Array.isArray(bData.products)) {
        this.saveProducts(bData.products);
        stats.products = bData.products.length;
      }
      // 2. Rate List
      if (Array.isArray(bData.rateList)) {
        this.saveRateList(bData.rateList);
        stats.rateList = bData.rateList.length;
      }
      // 3. Valuations
      if (Array.isArray(bData.valuations)) {
        this.saveValuations(bData.valuations);
        stats.valuations = bData.valuations.length;
      }
      // 4. Repair Bookings
      if (Array.isArray(bData.repairBookings)) {
        this.saveRepairBookings(bData.repairBookings);
        stats.repairBookings = bData.repairBookings.length;
      }
      // 5. Orders
      if (Array.isArray(bData.orders)) {
        this.saveOrders(bData.orders);
      }
      // 6. Upcoming Models
      if (Array.isArray(bData.upcomingModels)) {
        this.saveUpcomingModels(bData.upcomingModels);
        stats.upcomingModels = bData.upcomingModels.length;
      }
      // 7. Pre-Bookings
      if (Array.isArray(bData.preBookings)) {
        this.savePreBookings(bData.preBookings);
        stats.preBookings = bData.preBookings.length;
      }
      // 8. Store Settings
      if (bData.storeSettings) {
        this.saveStoreSettings(bData.storeSettings);
        stats.storeSettingsRestored = true;
      }
      // 9. Popup Settings
      if (bData.popupSettings) {
        this.savePopupSettings(bData.popupSettings);
        stats.popupSettingsRestored = true;
      }
    } else {
      // MERGE MODE (Combines existing with backup data, preventing duplicate IDs)
      // 1. Products
      if (Array.isArray(bData.products) && bData.products.length > 0) {
        const currentProducts = this.getProducts();
        const existingIds = new Set(currentProducts.map(p => p.id));
        const newProducts = bData.products.filter(p => !existingIds.has(p.id));
        const merged = [...newProducts, ...currentProducts];
        this.saveProducts(merged);
        stats.products = merged.length;
      }

      // 2. Rate List
      if (Array.isArray(bData.rateList) && bData.rateList.length > 0) {
        const currentRateList = this.getRateList();
        const existingKeys = new Set(currentRateList.map(r => `${r.model}_${r.storage}`));
        const newRates = bData.rateList.filter(r => !existingKeys.has(`${r.model}_${r.storage}`));
        const merged = [...currentRateList, ...newRates];
        this.saveRateList(merged);
        stats.rateList = merged.length;
      }

      // 3. Valuations
      if (Array.isArray(bData.valuations) && bData.valuations.length > 0) {
        const currentValuations = this.getValuationRequests();
        const existingIds = new Set(currentValuations.map(v => v.id));
        const newVals = bData.valuations.filter(v => !existingIds.has(v.id));
        const merged = [...newVals, ...currentValuations];
        this.saveValuations(merged);
        stats.valuations = merged.length;
      }

      // 4. Repair Bookings
      if (Array.isArray(bData.repairBookings) && bData.repairBookings.length > 0) {
        const currentRepairs = this.getRepairBookings();
        const existingIds = new Set(currentRepairs.map(r => r.id));
        const newRepairs = bData.repairBookings.filter(r => !existingIds.has(r.id));
        const merged = [...newRepairs, ...currentRepairs];
        this.saveRepairBookings(merged);
        stats.repairBookings = merged.length;
      }

      // 5. Upcoming Models
      if (Array.isArray(bData.upcomingModels) && bData.upcomingModels.length > 0) {
        const currentUpcoming = this.getUpcomingModels();
        const existingIds = new Set(currentUpcoming.map(u => u.id));
        const newUpcoming = bData.upcomingModels.filter(u => !existingIds.has(u.id));
        const merged = [...currentUpcoming, ...newUpcoming];
        this.saveUpcomingModels(merged);
        stats.upcomingModels = merged.length;
      }

      // 6. Pre-Bookings
      if (Array.isArray(bData.preBookings) && bData.preBookings.length > 0) {
        const currentBookings = this.getPreBookings();
        const existingIds = new Set(currentBookings.map(b => b.id));
        const newBookings = bData.preBookings.filter(b => !existingIds.has(b.id));
        const merged = [...newBookings, ...currentBookings];
        this.savePreBookings(merged);
        stats.preBookings = merged.length;
      }

      // Store settings & popup settings in merge mode: keep existing or take if missing
      if (bData.storeSettings) {
        this.saveStoreSettings(bData.storeSettings);
        stats.storeSettingsRestored = true;
      }
      if (bData.popupSettings) {
        this.savePopupSettings(bData.popupSettings);
        stats.popupSettingsRestored = true;
      }
    }

    return {
      success: true,
      message: `All data successfully restored (${mode === 'replace' ? 'Complete Replacement' : 'Merged with Existing'}).`,
      restoredAt: new Date().toISOString(),
      mode,
      stats
    };
  }

  /**
   * Factory Reset (Restores initial factory defaults for all sections)
   */
  static resetAllDataToFactoryDefaults(): void {
    this.saveProducts(initialProducts);
    this.saveRateList(initialUsedIPhoneRateList);
    this.saveValuations([]);
    this.saveRepairBookings([]);
    this.saveOrders([]);
    this.saveUpcomingModels(initialUpcomingModels);
    this.savePreBookings([]);
    this.saveStoreSettings(initialStoreSettings);
    this.savePopupSettings(initialPopupSettings);
    this.resetPopupDismissed();
  }
}
