export type ProductCondition = 'New' | 'Pre-Owned' | 'Used' | 'Refurbished';

export type ProductAvailability = 'In Stock' | 'Available' | 'Out of Stock' | 'Sold Out' | 'Pre-Order' | 'Limited Stock';

export interface ProductVariant {
  storage: string;
  price: number;
  originalPrice?: number;
  ram?: string;
  availability?: ProductAvailability;
}

export interface ProductSpecs {
  display?: string;
  processor?: string;
  camera?: string;
  battery?: string;
  charging?: string;
  os?: string;
  simType?: string;
  security?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model?: string;
  category: string;
  condition: ProductCondition;
  conditionGrade?: string;
  batteryHealth?: string;
  price: number;
  originalPrice?: number;
  image: string; // Primary / Cover Photo
  images?: string[]; // All product photos
  additionalImages?: string[];
  storage?: string;
  ram?: string;
  variants?: ProductVariant[];
  color?: string;
  availableColors?: string[];
  colorImages?: Record<string, string>;
  description?: string;
  specs?: ProductSpecs;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isLineupItem?: boolean; // Show in featured lineup comparison row
  isLineupHero?: boolean; // Primary flagship hero card
  lineupOrder?: number; // Sorting order in lineup
  lineupTagline?: string; // Custom tagline for showcase (e.g. Titanium • A18 Pro)
  lineupBadge?: string; // Badge text for showcase (e.g. Built for Apple Intelligence)
  isHidden?: boolean; // Toggle hide/show on storefront
  availability?: ProductAvailability;
  warranty?: string;
  boxIncludes?: string[];
  isDemo?: boolean;
  stock?: number; // Stock quantity in units
  discountPrice?: number; // Discounted selling price
  costPrice?: number; // Purchasing cost price
  createdAt?: string;
  updatedAt?: string;
  vatBillAvailable?: boolean;
  warrantySlipProvided?: boolean;
}

export interface RateListItem {
  id: string;
  model: string;
  brand: string;
  category?: string; // 'Smartphone' | 'Accessories' | etc.
  storage?: string;
  condition: string; // 'New' | 'Pre-Owned' | 'Used' | 'Refurbished' etc.
  batteryHealth?: string;
  sellingPrice: number;
  marketPrice?: number;
  warranty?: string;
  status: 'In Stock' | 'Limited' | 'Coming Soon' | 'Out of Stock' | string;
  image?: string;
  updatedAt?: string;
  priceA?: number;
  priceB?: number;
  lastUpdated?: string;
}

export type RepairStatus =
  | 'New'
  | 'Contacted'
  | 'Diagnosing'
  | 'Price Estimated'
  | 'Repair Approved'
  | 'Repairing'
  | 'Ready'
  | 'Completed'
  | 'Cancelled';

export interface RepairBooking {
  id: string;
  bookingCode: string;
  customerName: string;
  phoneNumber: string;
  customerAddress?: string;
  alternatePhone?: string;
  mobileBrand: string;
  mobileModel: string;
  imeiOrSerial?: string;
  devicePasscode?: string;
  accessoriesReceived?: string;
  physicalCondition?: string;
  problemType: string;
  problemDescription: string;
  preferredDate: string;
  preferredTime: string;
  deliveryDate?: string;
  photo?: string;
  status: RepairStatus;
  tentativePrice?: number;
  advancePaid?: number;
  finalPrice?: number;
  notes?: string;
  technicianName?: string;
  technicianPhone?: string;
  createdAt: string;
  updatedAt?: string;

  // Compatibility aliases
  phone?: string;
  deviceModel?: string;
  issue?: string;
  phoneModel?: string;
  issueType?: string;
  description?: string;
  estimatedCost?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  storage?: string;
  color?: string;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'Cash on Delivery' | 'Esewa / Khalti' | 'Bank Transfer' | 'Store Pickup';
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export type ValuationStatus = 
  | 'New'
  | 'Under Review'
  | 'Contacted'
  | 'Physical Inspection Required'
  | 'Valuation Given'
  | 'Accepted'
  | 'Rejected'
  | 'Completed';

export type ValuationType = 'sell' | 'exchange';

export interface PhoneConditionCheck {
  frontDisplay: 'Excellent' | 'Good' | 'Scratched' | 'Cracked' | 'Damaged';
  touchScreen: 'Working' | 'Partially Working' | 'Not Working';
  backGlass: 'Excellent' | 'Good' | 'Scratched' | 'Cracked' | 'Damaged';
  frameBody: 'Excellent' | 'Good' | 'Scratched' | 'Dented' | 'Damaged';
  camera: 'Front & Rear Working' | 'Front Camera Working' | 'Rear Camera Working' | 'Camera Problem';
  speaker: 'Working' | 'Problem';
  microphone: 'Working' | 'Problem';
  chargingPort: 'Working' | 'Loose' | 'Damaged';
  buttons: 'All Working' | 'Some Problem';
  batteryHealth: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Unknown';
  faceIdFingerprint: 'Working' | 'Not Working' | 'Not Available';
  networkWifi: 'Working' | 'Problem';
  waterDamage: 'No' | 'Yes' | 'Unknown';
  previousRepair: 'No' | 'Yes';
}

export interface PhonePhotos {
  front?: string;
  back?: string;
  leftSide?: string;
  rightSide?: string;
  top?: string;
  bottom?: string;
}

export interface PhoneValuationRequest {
  id: string;
  valuationId: string; // e.g. "PMS-VAL-2026-98124"
  type: ValuationType; // 'sell' or 'exchange'
  
  // Customer Info
  customerName: string;
  mobileNumber: string;
  
  // Phone Info
  phoneBrand: string;
  phoneModel: string;
  storage: string;
  ram: string;
  imeiNumber?: string;
  purchaseAge: string;
  expectedPrice?: number;
  additionalNotes?: string;
  
  // 14-Point Condition Checklist
  condition: PhoneConditionCheck;
  
  // Uploaded Photos
  photos: PhonePhotos;
  
  // Exchange Target (if type === 'exchange')
  exchangeTarget?: {
    productId?: string;
    productName: string;
    targetStorage?: string;
    targetColor?: string;
    targetPrice?: number;
    targetImage?: string;
  };
  
  // Admin Valuation Details
  estimatedValuationPrice?: number;
  finalValuationPrice?: number;
  exchangeAdjustmentAmount?: number;
  adminNotes?: string;
  status: ValuationStatus;
  
  createdAt: string;
  updatedAt: string;

  // Compatibility aliases
  customerPhone?: string;
  model?: string;
  batteryHealth?: any;
  bodyCondition?: string;
  screenCondition?: string;
  estimatedValue?: number;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  phone1: string;
  phone2: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  googleMapsUrl: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  bannerNotice?: string;
  showBannerNotice: boolean;
  technicianName?: string;
  technicianPhone?: string;
  // Lineup Showcase Banner controls
  showLineupBanner?: boolean;
  lineupTitle?: string;
  lineupSubtitle?: string;
  lineupHeroProductId?: string;
  lineupProductIds?: string[];
}

export type PreBookingStatus = 'New' | 'Contacted' | 'Confirmed' | 'Cancelled';

export interface UpcomingModelSpec {
  label: string;
  value: string;
}

export interface UpcomingModel {
  id: string;
  slug: string;
  brand: string;
  name: string;
  model: string;
  tagline?: string;
  badge?: string;
  image: string;
  additionalImages?: string[];
  expectedLaunchDate: string;
  expectedPrice?: number;
  expectedPriceText?: string;
  description: string;
  keyFeatures: string[];
  specs: UpcomingModelSpec[];
  availableColors: string[];
  storageVariants: string[];
  isFeaturedInPopup: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PreBookingRequest {
  id: string;
  bookingCode: string;
  upcomingModelId?: string;
  modelName: string;
  brand: string;
  variant?: string;
  color?: string;
  quantity: number;
  customerName: string;
  mobileNumber: string;
  whatsappNumber: string;
  email?: string;
  message?: string;
  status: PreBookingStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PopupSettings {
  isEnabled: boolean;
  delaySeconds: number;
  mode: 'single' | 'carousel';
  activeModelId?: string;
  heading?: string;
  subheading?: string;
}

export interface FullAppBackupData {
  version: string;
  exportedAt: string;
  appName: string;
  appDomain?: string;
  checksum?: string;
  summary: {
    productsCount: number;
    rateListCount: number;
    valuationsCount: number;
    repairBookingsCount: number;
    upcomingModelsCount: number;
    preBookingsCount: number;
    hasStoreSettings: boolean;
    hasPopupSettings: boolean;
  };
  data: {
    products: Product[];
    rateList: RateListItem[];
    valuations: PhoneValuationRequest[];
    repairBookings: RepairBooking[];
    orders: CustomerOrder[];
    storeSettings: StoreSettings;
    upcomingModels: UpcomingModel[];
    preBookings: PreBookingRequest[];
    popupSettings: PopupSettings;
  };
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restoredAt: string;
  mode: 'replace' | 'merge';
  stats: {
    products: number;
    rateList: number;
    valuations: number;
    repairBookings: number;
    upcomingModels: number;
    preBookings: number;
    storeSettingsRestored: boolean;
    popupSettingsRestored: boolean;
  };
}

export type StoreUserRole = 'admin' | 'secondary_admin' | 'staff' | 'cashier' | 'technician';

export interface StoreUserPermissions {
  canManageProducts: boolean;
  canManageRateList: boolean;
  canManageValuations: boolean;
  canManageRepairs: boolean;
  canManageUpcoming: boolean;
  canAccessAccounting: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

export interface StoreUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  role: StoreUserRole;
  pin: string; // 4-digit PIN for quick staff login
  password?: string;
  permissions: StoreUserPermissions;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
  isPrimaryAdmin?: boolean;
  avatarColor?: string;
}

export type ReviewServiceType = 'Purchase' | 'Exchange' | 'Repair' | 'General';

export interface CustomerReview {
  id: string;
  customerName: string;
  location?: string;
  rating: number; // 1 to 5
  reviewText: string;
  serviceType: ReviewServiceType;
  deviceModel?: string;
  date: string; // YYYY-MM-DD or readable date
  isVerifiedBuyer?: boolean;
  avatarUrl?: string;
  createdAt?: string;
  syncedAt?: string;
  replyFromOwner?: string;
  replyDate?: string;
}


