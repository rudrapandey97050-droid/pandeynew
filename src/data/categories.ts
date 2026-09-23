export interface Category {
  id: string;
  name: string;
  iconName: string;
  count?: number;
  popular?: boolean;
}

export const initialCategories: Category[] = [
  { id: 'all', name: 'All Phones', iconName: 'Smartphone', popular: true },
  { id: 'Apple', name: 'Apple / iPhone', iconName: 'Apple', popular: true },
  { id: 'Samsung', name: 'Samsung', iconName: 'Layers', popular: true },
  { id: 'Vivo', name: 'Vivo', iconName: 'Camera', popular: true },
  { id: 'POCO', name: 'POCO', iconName: 'Zap', popular: true },
  { id: 'HONOR', name: 'HONOR', iconName: 'Cpu', popular: true },
  { id: 'Redmi', name: 'Redmi', iconName: 'Smartphone', popular: true },
  { id: 'Pre-Owned', name: 'Pre-Owned / Used', iconName: 'RefreshCw', popular: true }
];
