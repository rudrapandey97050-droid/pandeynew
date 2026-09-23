export interface CustomerReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  phoneBoughtOrRepaired: string;
}

export const initialReviews: CustomerReview[] = [
  {
    id: "rev-1",
    name: "Bikash Thapa",
    location: "Traffic Chowk, Butwal",
    rating: 5,
    date: "2 days ago",
    comment: "Pandey Mobile Store बाट मैले iPhone 15 Pro Max लिएको, एकदम सफा कन्डिसन र ब्याट्री हेल्थ राम्रो थियो। बुटवलमा सबभन्दा भरपर्दो पसल!",
    phoneBoughtOrRepaired: "Apple iPhone 15 Pro Max"
  },
  {
    id: "rev-2",
    name: "Sunita Shrestha",
    location: "Golpark, Butwal",
    rating: 5,
    date: "1 week ago",
    comment: "मेरो पुरानो Samsung फोन एक्सचेन्ज गरेर नयाँ फोन लिएँ। तत्काल मूल्यांकन गरेर राम्रो रेट दिनुभयो। Staff व्यवहार पनि निकै राम्रो।",
    phoneBoughtOrRepaired: "Phone Exchange & Upgrade"
  },
  {
    id: "rev-3",
    name: "Ramesh Poudel",
    location: "Drivertole, Butwal",
    rating: 5,
    date: "2 weeks ago",
    comment: "Display change गराएको, ओरिजिनल पार्ट र ३० मिनेटमै रिपेयर गरेर दिनुभयो। वारेन्टी पनि दिनुहुन्छ।",
    phoneBoughtOrRepaired: "Screen Replacement Service"
  }
];

export interface StoreService {
  id: string;
  title: string;
  nepaliTitle: string;
  description: string;
  iconName: string;
  badge?: string;
}

export const storeServices: StoreService[] = [
  {
    id: "srv-exchange",
    title: "Mobile Valuation & Exchange",
    nepaliTitle: "मोबाइल मुल्यांकन तथा एक्सचेन्ज",
    description: "Best exchange valuation in Butwal for your used iPhone or Android smartphone with hassle-free upgrade.",
    iconName: "RefreshCw",
    badge: "Instant Evaluation"
  },
  {
    id: "srv-repair",
    title: "Express Phone Repair",
    nepaliTitle: "द्रुत मर्मत सेवा",
    description: "Display replacement, battery health renewal, motherboard IC repair with certified parts and store warranty.",
    iconName: "Wrench",
    badge: "Same-Day Service"
  },
  {
    id: "srv-used-phones",
    title: "Certified Used iPhones",
    nepaliTitle: "प्रमाणित सेकेन्ड ह्यान्ड आइफोन",
    description: "100% original, 15-point tested used iPhones with store warranty slip and 15 days testing guarantee.",
    iconName: "ShieldCheck",
    badge: "15 Days Warranty"
  },
  {
    id: "srv-emi",
    title: "0% EMI & Financing",
    nepaliTitle: "किस्ताबन्दी (EMI) सुविधा",
    description: "Buy latest smartphones with zero percent easy EMI facility through partner credit cards and finance.",
    iconName: "CreditCard",
    badge: "Easy Approval"
  }
];
