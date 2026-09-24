import { StoreSettings } from '../types.ts';
import { initialPaymentQRs } from './initialPaymentQRs.ts';

export const initialStoreSettings: StoreSettings = {
  storeName: "Pandey Mobile Store",
  tagline: "Your Trusted Mobile & Gadget Destination in Butwal",
  address: "Traffic Chowk, Main Road",
  city: "Butwal, Rupandehi, Nepal",
  phone1: "9847460603",
  phone2: "9804477123",
  whatsapp: "9847460603",
  email: "pandeymobilestore@gmail.com",
  openingHours: "10:00 AM - 8:00 PM (Sun - Fri)",
  googleMapsUrl: "https://maps.google.com/?q=Traffic+Chowk+Butwal",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  tiktokUrl: "https://tiktok.com",
  youtubeUrl: "https://youtube.com",
  bannerNotice: "🔥 Festival Exchange Mela: Get best valuation on your old smartphone with zero hassle exchange at Traffic Chowk, Butwal!",
  showBannerNotice: true,
  technicianName: "Er. Ramesh Pandey (Chief Lab Specialist)",
  technicianPhone: "9847460603",
  showLineupBanner: true,
  lineupTitle: "Explore the iPhone Lineup",
  lineupSubtitle: "Brand new seal pack with 1-Year Apple Nepal Warranty & certified pre-owned phones with testing guarantee. Available at Pandey Mobile, Butwal.",
  lineupHeroProductId: undefined,
  lineupProductIds: [],
  // QR Payment & Storefront Display
  paymentQRs: initialPaymentQRs,
  showPaymentQRsInFooter: true,
  showPaymentQRsInContact: true,
  qrPaymentHeading: "डिजिटल भुक्तानी (Scan & Pay)",
  qrPaymentSubheading: "FonePay, eSewa, Khalti तथा नेपालका सबै मोबाइल बैंकिङ्गबाट सुरक्षित भुक्तानी गर्नुहोस्"
};
