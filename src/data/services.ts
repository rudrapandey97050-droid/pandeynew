export interface CustomerReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  phoneBoughtOrRepaired: string;
}

export const initialReviews: CustomerReview[] = [];

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
