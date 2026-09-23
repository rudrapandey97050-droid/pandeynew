import { CustomerReview } from '../types.ts';

export const initialCustomerReviews: CustomerReview[] = [
  {
    id: 'rev-001',
    customerName: 'Suman Thapa',
    location: 'Tilottama-4, Drivertole',
    rating: 5,
    reviewText: 'iPhone 13 exchange गरेर 15 Pro Max 256GB लिएको। ३२-प्वाइन्ट कम्प्युटराइज्ड चेक गरेर एकदमै निष्पक्ष भ्यालुएसन दिनुभयो। बुटवलमा सबभन्दा भरपर्दो र पारदर्शी मोबाइल पसल यही हो!',
    serviceType: 'Exchange',
    deviceModel: 'iPhone 15 Pro Max',
    date: '2026-03-18',
    isVerifiedBuyer: true,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    createdAt: '2026-03-18T11:20:00.000Z',
    replyFromOwner: 'धन्यवाद सुमन भाइ! तपाईंको विश्वासको लागि हामी सधैं आभारी छौं।',
    replyDate: '2026-03-18'
  },
  {
    id: 'rev-002',
    customerName: 'Anup Shrestha',
    location: 'Traffic Chowk, Butwal',
    rating: 5,
    reviewText: 'मेरो Samsung Galaxy S23 Ultra को ओरिजिनल डिस्प्ले १ घण्टामै फेरिदिनुभयो। पसलमै बसेर हेर्न पाइने र १ वर्षको लिखित वारेन्टी कार्ड पनि दिनुभयो। Express repair service एकदमै उत्कृष्ट लाग्यो!',
    serviceType: 'Repair',
    deviceModel: 'Galaxy S23 Ultra Display',
    date: '2026-03-15',
    isVerifiedBuyer: true,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    createdAt: '2026-03-15T15:45:00.000Z'
  },
  {
    id: 'rev-003',
    customerName: 'Dr. Rita Adhikari',
    location: 'Milanchowk, Butwal',
    rating: 5,
    reviewText: 'Bought brand new sealed-pack iPhone 16 for official use. Genuine VAT bill and MDMS registration was cleared on the spot. Highly professional staff at Pandey Mobile Store.',
    serviceType: 'Purchase',
    deviceModel: 'iPhone 16 128GB (Teal)',
    date: '2026-03-10',
    isVerifiedBuyer: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
    createdAt: '2026-03-10T14:10:00.000Z',
    replyFromOwner: 'Thank you Dr. Rita for trusting us! Wish you a seamless experience with your new device.',
    replyDate: '2026-03-11'
  },
  {
    id: 'rev-004',
    customerName: 'Bikram Pandey',
    location: 'Bhairahawa, Bank Road',
    rating: 5,
    reviewText: 'Certified Pre-Owned iPhone 14 battery health 92% मा किनेको। ३ महिना भइसक्यो ब्याट्री ब्याकअप र पर्फर्मेन्स नयाँ जस्तै छ। साथमा ओरिजिनल २०W चार्जर पनि दिनुभयो।',
    serviceType: 'Purchase',
    deviceModel: 'Pre-Owned iPhone 14',
    date: '2026-03-04',
    isVerifiedBuyer: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    createdAt: '2026-03-04T09:30:00.000Z'
  },
  {
    id: 'rev-005',
    customerName: 'Pooja K.C.',
    location: 'Golpark, Butwal',
    rating: 5,
    reviewText: 'चार्ज नहुने समस्या लिएर गएकी थिएँ, धेरै ठाउँमा मदरबोर्ड बिग्रियो भनेका थिए। यहाँका टेक्निसियनले सिम्पल चार्जिङ पोर्ट सफा गरेर समस्या तुरुन्त समाधान गरिदिनुभयो। इमान्दार र निष्पक्ष सेवा!',
    serviceType: 'Repair',
    deviceModel: 'Vivo V29 Charging Port',
    date: '2026-02-27',
    isVerifiedBuyer: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    createdAt: '2026-02-27T16:20:00.000Z'
  },
  {
    id: 'rev-006',
    customerName: 'Roshan GC',
    location: 'Palpa Road, Butwal',
    rating: 5,
    reviewText: 'वेबसाइटमै दैनिक Rate List हेरेर पुरानो फोन साट्न गएको थिएँ। वेबसाइटमा जे देखाइएको थियो, त्यही rate मा बिना कुनै बार्गेनिङ तुरुन्त cash voucher सँगै नयाँ फोन साट्न पाइयो। Super fast!',
    serviceType: 'Exchange',
    deviceModel: 'OnePlus 11 to iPhone 15',
    date: '2026-02-20',
    isVerifiedBuyer: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    createdAt: '2026-02-20T12:00:00.000Z'
  }
];
