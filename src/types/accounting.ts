// Accounting Platform Types for Pandey Mobile Store
// Completely separated from public storefront and standard website management

export type PartyType = 'customer' | 'supplier';
export type AccountingUserRole = 'admin' | 'accountant' | 'cashier' | 'viewer';
export type ExpenseCategory = string;

export interface AccountingParty {
  id: string;
  type: PartyType;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  panVatNumber?: string;
  openingBalance: number; // Positive number
  openingBalanceType: 'dr' | 'cr'; // 'dr' = receivable (debit), 'cr' = payable (credit)
  currentBalance: number; // Calculated dynamic balance: positive = receivable from customer / payable to supplier
  creditLimit?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesInvoiceItem {
  id: string;
  productId?: string; // Link to website product if any
  productName: string;
  brand: string;
  model: string;
  imeiOrSerial?: string;
  warrantyMonths?: number;
  qty: number;
  purchaseCost: number; // Cost price for profit calculation
  rate: number; // Selling price per unit
  discount: number; // Discount per item or flat
  taxPercent: number; // 0 or 13%
  taxAmount: number;
  totalAmount: number; // (qty * rate - discount) + tax
}

export type InvoicePaymentStatus = 'paid' | 'partial' | 'unpaid';
export type InvoiceStatus = 'active' | 'cancelled' | 'returned';

export interface SalesInvoice {
  id: string;
  invoiceNumber: string; // e.g. PMS-INV-2081-0001
  invoiceDate: string; // YYYY-MM-DD
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerPan?: string;
  items: SalesInvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: InvoicePaymentStatus;
  paymentMethod: string; // 'Cash' | 'Bank Transfer' | 'eSewa' | 'Khalti' | 'Credit'
  paymentAccountId: string;
  notes?: string;
  status: InvoiceStatus;
  totalCost: number; // Sum of items cost
  grossProfit: number; // grandTotal (excluding tax) - totalCost
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesReturnItem {
  id: string;
  productName: string;
  imeiOrSerial?: string;
  qty: number;
  refundRate: number;
  totalRefund: number;
  reason?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  returnDate: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerId: string;
  customerName: string;
  items: SalesReturnItem[];
  totalRefundAmount: number;
  refundMethod: string;
  paymentAccountId: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  productId?: string;
  productName: string;
  brand: string;
  model: string;
  imeiOrSerial?: string;
  warrantyMonths?: number;
  qty: number;
  purchaseCost: number;
  expectedSellingPrice?: number;
  totalAmount: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string; // PMS-PUR-2081-0001
  billNumber?: string; // Supplier's physical bill number
  invoiceDate: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  supplierAddress?: string;
  supplierPan?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: InvoicePaymentStatus;
  paymentMethod: string;
  paymentAccountId: string;
  notes?: string;
  status: InvoiceStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseReturnItem {
  id: string;
  productName: string;
  imeiOrSerial?: string;
  qty: number;
  returnCost: number;
  totalDebit: number;
  reason?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  returnDate: string;
  originalPurchaseId: string;
  originalPurchaseNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseReturnItem[];
  totalDebitAmount: number;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // PMS-REC-0001
  date: string;
  partyId: string;
  partyName: string;
  partyPhone?: string;
  partyType: 'customer';
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  referenceNo?: string;
  referenceNumber?: string;
  invoiceId?: string; // Optional specific invoice
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string; // PMS-PAY-0001
  date: string;
  partyId: string;
  partyName: string;
  partyPhone?: string;
  partyType: 'supplier';
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  referenceNo?: string;
  referenceNumber?: string;
  purchaseInvoiceId?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  expenseNumber: string;
  date: string;
  category: string; // e.g. Rent, Salary, Electricity, Tea & Snacks, Maintenance
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  payee?: string;
  referenceNumber?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  accountName: string; // e.g. Cash in Hand, Nabil Bank, Global IME, eSewa
  accountType: 'cash' | 'bank' | 'wallet';
  accountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  openingBalance: number;
  currentBalance: number;
  isDefault?: boolean;
}

export interface AccountTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export type BillPaperSize = 'a4' | 'a5_portrait' | 'a5_landscape' | 'thermal_80' | 'thermal_58' | 'custom';

export interface PrintSetupConfig {
  paperSize: BillPaperSize;
  customWidthMm?: number; // e.g. 148, 210, 80
  customHeightMm?: number; // e.g. 210, 297 or undefined for roll
  orientation?: 'portrait' | 'landscape';
  marginMm?: number; // 0, 5, 8, 12, 15
  fontScale?: 'compact' | 'normal' | 'large';
  copies?: 1 | 2; // 1 = Single, 2 = Duplicate (Original + Store Copy)
  showPanVat?: boolean;
  showImei?: boolean;
  showWarranty?: boolean;
  showTerms?: boolean;
  showSignatures?: boolean;
  showPaidStamp?: boolean;
  showCustomerAddress?: boolean;
  showCompanyHeader?: boolean;
}

export interface AccountingSettings {
  financialYear: string; // e.g. '2081/82 (2024-2025)'
  currency: string; // 'Rs.'
  invoicePrefix: string;
  nextInvoiceNumber: number;
  purchasePrefix: string;
  nextPurchaseNumber: number;
  receiptPrefix: string;
  nextReceiptNumber: number;
  paymentPrefix: string;
  nextPaymentNumber: number;
  expensePrefix: string;
  nextExpenseNumber: number;
  enableVat: boolean;
  vatRate: number; // 13%
  panNumber: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  printHeaderNote: string;
  printTerms: string;
  defaultPaymentMethod: string;
  defaultPaperSize?: BillPaperSize;
  printSetup?: PrintSetupConfig;
}

export interface AccountingUserPermission {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'accountant' | 'cashier' | 'viewer';
  pinCode: string;
  permissions: {
    viewAccounting: boolean;
    createSales: boolean;
    editSales: boolean;
    deleteSales: boolean;
    createPurchase: boolean;
    editPurchase: boolean;
    deletePurchase: boolean;
    viewReports: boolean;
    exportReports: boolean;
    manageCustomers: boolean;
    manageSuppliers: boolean;
    manageExpenses: boolean;
    manageAccountingSettings: boolean;
  };
  active: boolean;
  createdAt: string;
}

export interface AccountingAuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: 'create' | 'edit' | 'delete' | 'cancel' | 'restore' | 'export';
  entity: 'sales' | 'purchase' | 'receipt' | 'payment' | 'expense' | 'party' | 'account' | 'settings' | 'inventory';
  entityId: string;
  entityType?: string;
  details: string;
}

export interface PartyTransactionStatement {
  date: string;
  refType: 'Opening Balance' | 'Sales Invoice' | 'Sales Return' | 'Purchase Invoice' | 'Purchase Return' | 'Receipt' | 'Payment';
  refNumber: string;
  description: string;
  debit: number; // Dr.
  credit: number; // Cr.
  balance: number;
}

export interface ProductLedgerEntry {
  id: string;
  date: string;
  type: 'Opening Stock' | 'Purchase Inward' | 'Sales Outward' | 'Sales Return Inward' | 'Purchase Return Outward' | 'Stock Adjustment';
  refNumber: string;
  partyName: string;
  partyType?: 'Supplier' | 'Customer' | 'Internal';
  imei?: string;
  inwardQty: number;
  inwardRate: number;
  inwardTotal: number;
  outwardQty: number;
  outwardRate: number;
  outwardTotal: number;
  profitEarned?: number;
  balanceQty: number;
  balanceValue: number;
  remarks?: string;
}

export interface ProductLedgerSummary {
  productId: string;
  productName: string;
  brand: string;
  model: string;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  totalInwardQty: number;
  totalInwardValue: number;
  totalOutwardQty: number;
  totalOutwardValue: number;
  totalGrossProfit: number;
  entries: ProductLedgerEntry[];
}

export interface ImeiVaultItem {
  id: string;
  imei: string;
  secondaryImei?: string;
  productId?: string;
  productName: string;
  brand: string;
  model?: string;
  color?: string;
  storage?: string;
  status: 'In Stock' | 'Sold' | 'Under Repair' | 'Reserved';
  purchaseCost?: number;
  purchaseBill?: string;
  purchaseDate?: string;
  supplierName?: string;
  salesInvoice?: string;
  salesDate?: string;
  customerName?: string;
  customerPhone?: string;
  warrantyExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
