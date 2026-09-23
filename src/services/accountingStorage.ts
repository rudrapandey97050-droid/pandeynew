// Accounting Storage Service for Pandey Mobile Store
// Completely segregated storage from public store data
// Real ledger calculations, real inventory hooks, zero fake transactions

import {
  AccountingParty,
  SalesInvoice,
  SalesReturn,
  PurchaseInvoice,
  PurchaseReturn,
  PaymentReceipt,
  PaymentVoucher,
  ExpenseRecord,
  BankAccount,
  AccountTransfer,
  AccountingSettings,
  AccountingUserPermission,
  AccountingAuditLog,
  PartyTransactionStatement,
  ProductLedgerEntry,
  ProductLedgerSummary,
  ImeiVaultItem
} from '../types/accounting.ts';
import { Product } from '../types.ts';
import { initialProducts } from '../data/products.ts';

const ACC_KEYS = {
  PARTIES: 'pms_acc_parties_v1',
  SALES: 'pms_acc_sales_v1',
  SALES_RETURNS: 'pms_acc_sales_returns_v1',
  PURCHASES: 'pms_acc_purchases_v1',
  PURCHASE_RETURNS: 'pms_acc_purchase_returns_v1',
  RECEIPTS: 'pms_acc_receipts_v1',
  PAYMENTS: 'pms_acc_payments_v1',
  EXPENSES: 'pms_acc_expenses_v1',
  ACCOUNTS: 'pms_acc_bank_accounts_v1',
  TRANSFERS: 'pms_acc_transfers_v1',
  SETTINGS: 'pms_acc_settings_v1',
  USERS: 'pms_acc_users_v1',
  AUDIT_LOGS: 'pms_acc_audit_logs_v1',
  ACTIVE_USER_SESSION: 'pms_acc_active_user_v1',
  IMEI_VAULT: 'pms_acc_imei_vault_v1',
  INVENTORY: 'pms_acc_inventory_items_v1'
};

const DEFAULT_SETTINGS: AccountingSettings = {
  financialYear: '2081/82 (2024-2025)',
  currency: 'Rs.',
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1001,
  purchasePrefix: 'PUR-',
  nextPurchaseNumber: 2001,
  receiptPrefix: 'REC-',
  nextReceiptNumber: 3001,
  paymentPrefix: 'PAY-',
  nextPaymentNumber: 4001,
  expensePrefix: 'EXP-',
  nextExpenseNumber: 5001,
  enableVat: false,
  vatRate: 13,
  panNumber: '601234567',
  companyName: 'Pandey Mobile electic and electronic suppliers',
  address: 'Traffic Chowk, Butwal, Rupandehi, Nepal',
  phone: '9857055743',
  email: 'pmesbutwal@gmail.com',
  printHeaderNote: 'Official Smartphone & Service Center • Butwal, Nepal',
  printTerms: '1. Sold goods are subject to store warranty policy. 2. Please preserve this invoice for warranty & exchange.',
  defaultPaymentMethod: 'Cash',
  defaultPaperSize: 'a4',
  printSetup: {
    paperSize: 'a4',
    customWidthMm: 210,
    customHeightMm: 297,
    orientation: 'portrait',
    marginMm: 8,
    fontScale: 'normal',
    copies: 1,
    showPanVat: true,
    showImei: true,
    showWarranty: true,
    showTerms: true,
    showSignatures: true,
    showPaidStamp: true,
    showCustomerAddress: true,
    showCompanyHeader: true
  }
};

const DEFAULT_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc_cash',
    accountName: 'Cash in Hand (काउन्टर नगद)',
    accountType: 'cash',
    openingBalance: 0,
    currentBalance: 0,
    isDefault: true
  },
  {
    id: 'acc_nabil',
    accountName: 'Nabil Bank (Current A/c)',
    accountType: 'bank',
    accountNumber: '02801017500123',
    bankBranch: 'Traffic Chowk, Butwal',
    openingBalance: 0,
    currentBalance: 0
  },
  {
    id: 'acc_esewa',
    accountName: 'eSewa Merchant Wallet',
    accountType: 'wallet',
    accountNumber: '9857055743',
    openingBalance: 0,
    currentBalance: 0
  }
];

const DEFAULT_USERS: AccountingUserPermission[] = [
  {
    id: 'acc_user_owner',
    username: 'admin',
    fullName: 'Store Owner / Admin',
    role: 'admin',
    pinCode: '1234',
    permissions: {
      viewAccounting: true,
      createSales: true,
      editSales: true,
      deleteSales: true,
      createPurchase: true,
      editPurchase: true,
      deletePurchase: true,
      viewReports: true,
      exportReports: true,
      manageCustomers: true,
      manageSuppliers: true,
      manageExpenses: true,
      manageAccountingSettings: true
    },
    active: true,
    createdAt: new Date().toISOString()
  }
];

export class AccountingStorageService {
  private static notifyChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pms_accounting_updated', { detail: { time: Date.now() } }));
    }
  }

  static subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener('pms_accounting_updated', handler);
    return () => window.removeEventListener('pms_accounting_updated', handler);
  }

  // --- SETTINGS ---
  static getSettings(): AccountingSettings {
    try {
      const data = localStorage.getItem(ACC_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.companyName === 'Pandey Mobile Store & Care') {
          parsed.companyName = 'Pandey Mobile electic and electronic suppliers';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Error reading accounting settings', e);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: AccountingSettings, user = 'admin'): void {
    localStorage.setItem(ACC_KEYS.SETTINGS, JSON.stringify(settings));
    this.recordAuditLog('edit', 'settings', 'config', 'Updated accounting settings & financial configuration', user);
    this.notifyChange();
  }

  // --- ACCOUNTS (CASH & BANK) ---
  static getAccounts(): BankAccount[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.ACCOUNTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading bank accounts', e);
    }
    // Initialize default accounts if none exist
    localStorage.setItem(ACC_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }

  static saveAccount(account: BankAccount, user = 'admin'): void {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    if (index >= 0) {
      accounts[index] = account;
      this.recordAuditLog('edit', 'account', account.id, `Updated account: ${account.accountName}`, user);
    } else {
      accounts.push(account);
      this.recordAuditLog('create', 'account', account.id, `Created account: ${account.accountName}`, user);
    }
    localStorage.setItem(ACC_KEYS.ACCOUNTS, JSON.stringify(accounts));
    this.notifyChange();
  }

  static adjustAccountBalance(accountId: string, amountChange: number): void {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      account.currentBalance = (account.currentBalance || 0) + amountChange;
      localStorage.setItem(ACC_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
  }

  static transferFunds(transfer: AccountTransfer, user = 'admin'): void {
    this.adjustAccountBalance(transfer.fromAccountId, -transfer.amount);
    this.adjustAccountBalance(transfer.toAccountId, transfer.amount);

    const transfers: AccountTransfer[] = [];
    try {
      const data = localStorage.getItem(ACC_KEYS.TRANSFERS);
      if (data) transfers.push(...JSON.parse(data));
    } catch (e) {}

    transfers.unshift(transfer);
    localStorage.setItem(ACC_KEYS.TRANSFERS, JSON.stringify(transfers));
    this.recordAuditLog(
      'create',
      'account',
      transfer.id,
      `Transferred Rs. ${transfer.amount} from ${transfer.fromAccountName} to ${transfer.toAccountName}`,
      user
    );
    this.notifyChange();
  }

  static getTransfers(): AccountTransfer[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.TRANSFERS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [];
  }

  // --- PARTIES (CUSTOMERS & SUPPLIERS) ---
  static getParties(type?: 'customer' | 'supplier'): AccountingParty[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.PARTIES);
      const list: AccountingParty[] = data ? JSON.parse(data) : [];
      if (type) {
        return list.filter(p => p.type === type);
      }
      return list;
    } catch (e) {
      console.error('Error reading parties', e);
      return [];
    }
  }

  static getPartyById(id: string): AccountingParty | undefined {
    return this.getParties().find(p => p.id === id);
  }

  static saveParty(party: AccountingParty, user = 'admin'): void {
    const parties = this.getParties();
    const index = parties.findIndex(p => p.id === party.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      parties[index] = { ...party, updatedAt: now };
      this.recordAuditLog('edit', 'party', party.id, `Updated ${party.type}: ${party.name}`, user);
    } else {
      parties.push({ ...party, createdAt: now, updatedAt: now });
      this.recordAuditLog('create', 'party', party.id, `Created ${party.type}: ${party.name}`, user);
    }

    localStorage.setItem(ACC_KEYS.PARTIES, JSON.stringify(parties));
    this.notifyChange();
  }

  static deleteParty(id: string, user = 'admin'): boolean {
    const parties = this.getParties();
    const target = parties.find(p => p.id === id);
    if (!target) return false;

    // Verify if party has existing sales or purchase invoices before deleting
    const sales = this.getSalesInvoices().filter(s => s.customerId === id && s.status === 'active');
    const purchases = this.getPurchases().filter(p => p.supplierId === id && p.status === 'active');

    if (sales.length > 0 || purchases.length > 0) {
      alert('यस ग्राहक/सप्लायरको सक्रिय बिल वा कारोबार रेकर्ड भएकोले सिधै हटाउन मिल्दैन।');
      return false;
    }

    const filtered = parties.filter(p => p.id !== id);
    localStorage.setItem(ACC_KEYS.PARTIES, JSON.stringify(filtered));
    this.recordAuditLog('delete', 'party', id, `Deleted ${target.type}: ${target.name}`, user);
    this.notifyChange();
    return true;
  }

  // --- SALES INVOICES ---
  static getSalesInvoices(): SalesInvoice[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.SALES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading sales invoices', e);
      return [];
    }
  }

  static getSalesInvoiceById(id: string): SalesInvoice | undefined {
    return this.getSalesInvoices().find(s => s.id === id);
  }

  static saveSalesInvoice(invoice: SalesInvoice, user = 'admin'): void {
    const invoices = this.getSalesInvoices();
    const index = invoices.findIndex(i => i.id === invoice.id);
    const isNew = index < 0;
    const now = new Date().toISOString();

    if (isNew) {
      invoices.unshift({ ...invoice, createdAt: now, updatedAt: now });

      // 1. Adjust customer balance (Due amount increases customer's debit / receivable)
      if (invoice.customerId) {
        const party = this.getPartyById(invoice.customerId);
        if (party) {
          party.currentBalance = (party.currentBalance || 0) + invoice.dueAmount;
          this.saveParty(party, user);
        }
      }

      // 2. Adjust payment account balance (Paid amount received into store account)
      if (invoice.paidAmount > 0 && invoice.paymentAccountId) {
        this.adjustAccountBalance(invoice.paymentAccountId, invoice.paidAmount);
      }

      // 3. Connect with website product stock - reduce inventory
      this.decrementProductInventory(invoice.items);

      // 4. Increment invoice sequence in settings
      const settings = this.getSettings();
      settings.nextInvoiceNumber = (settings.nextInvoiceNumber || 1000) + 1;
      localStorage.setItem(ACC_KEYS.SETTINGS, JSON.stringify(settings));

      this.recordAuditLog(
        'create',
        'sales',
        invoice.id,
        `Created Sales Invoice #${invoice.invoiceNumber} for ${invoice.customerName} (Rs. ${invoice.grandTotal})`,
        user
      );
    } else {
      const oldInvoice = invoices[index];
      invoices[index] = { ...invoice, updatedAt: now };

      // Reconcile party balances, cash/bank account, and stock inventory if active
      if (oldInvoice.status === 'active' && invoice.status === 'active') {
        // 1. Reconcile Customer Dues
        if (oldInvoice.customerId === invoice.customerId) {
          const deltaDue = Number(invoice.dueAmount || 0) - Number(oldInvoice.dueAmount || 0);
          if (deltaDue !== 0 && invoice.customerId) {
            const party = this.getPartyById(invoice.customerId);
            if (party) {
              party.currentBalance = Math.max(0, (party.currentBalance || 0) + deltaDue);
              this.saveParty(party, user);
            }
          }
        } else {
          // Customer changed on the bill
          if (oldInvoice.customerId && oldInvoice.dueAmount > 0) {
            const oldParty = this.getPartyById(oldInvoice.customerId);
            if (oldParty) {
              oldParty.currentBalance = Math.max(0, (oldParty.currentBalance || 0) - oldInvoice.dueAmount);
              this.saveParty(oldParty, user);
            }
          }
          if (invoice.customerId && invoice.dueAmount > 0) {
            const newParty = this.getPartyById(invoice.customerId);
            if (newParty) {
              newParty.currentBalance = (newParty.currentBalance || 0) + invoice.dueAmount;
              this.saveParty(newParty, user);
            }
          }
        }

        // 2. Reconcile Payment Account Balance
        if (oldInvoice.paymentAccountId === invoice.paymentAccountId) {
          const deltaPaid = Number(invoice.paidAmount || 0) - Number(oldInvoice.paidAmount || 0);
          if (deltaPaid !== 0 && invoice.paymentAccountId) {
            this.adjustAccountBalance(invoice.paymentAccountId, deltaPaid);
          }
        } else {
          if (oldInvoice.paidAmount > 0 && oldInvoice.paymentAccountId) {
            this.adjustAccountBalance(oldInvoice.paymentAccountId, -oldInvoice.paidAmount);
          }
          if (invoice.paidAmount > 0 && invoice.paymentAccountId) {
            this.adjustAccountBalance(invoice.paymentAccountId, invoice.paidAmount);
          }
        }

        // 3. Reconcile Stock Inventory (revert previous items, deduct new items)
        this.incrementProductInventory(oldInvoice.items);
        this.decrementProductInventory(invoice.items);
      }

      this.recordAuditLog(
        'edit',
        'sales',
        invoice.id,
        `Updated Sales Invoice #${invoice.invoiceNumber} (${invoice.customerName}, Rs. ${invoice.grandTotal})`,
        user
      );
    }

    localStorage.setItem(ACC_KEYS.SALES, JSON.stringify(invoices));
    this.notifyChange();
  }

  static cancelSalesInvoice(invoiceId: string, reason = '', user = 'admin'): boolean {
    const invoices = this.getSalesInvoices();
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice || invoice.status === 'cancelled') return false;

    invoice.status = 'cancelled';
    invoice.notes = (invoice.notes ? invoice.notes + ' | ' : '') + `Cancelled: ${reason}`;
    invoice.updatedAt = new Date().toISOString();

    // Reverse customer balance
    if (invoice.customerId && invoice.dueAmount > 0) {
      const party = this.getPartyById(invoice.customerId);
      if (party) {
        party.currentBalance = Math.max(0, (party.currentBalance || 0) - invoice.dueAmount);
        this.saveParty(party, user);
      }
    }

    // Reverse paid money if refund is handled
    if (invoice.paidAmount > 0 && invoice.paymentAccountId) {
      this.adjustAccountBalance(invoice.paymentAccountId, -invoice.paidAmount);
    }

    // Restore stock inventory
    this.incrementProductInventory(invoice.items);

    localStorage.setItem(ACC_KEYS.SALES, JSON.stringify(invoices));
    this.recordAuditLog('cancel', 'sales', invoice.id, `Cancelled Sales Invoice #${invoice.invoiceNumber}. Reason: ${reason}`, user);
    this.notifyChange();
    return true;
  }

  // --- SALES RETURNS ---
  static getSalesReturns(): SalesReturn[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.SALES_RETURNS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static saveSalesReturn(ret: SalesReturn, user = 'admin'): void {
    const list = this.getSalesReturns();
    list.unshift(ret);
    localStorage.setItem(ACC_KEYS.SALES_RETURNS, JSON.stringify(list));

    // Deduct refund from payment account
    if (ret.totalRefundAmount > 0 && ret.paymentAccountId) {
      this.adjustAccountBalance(ret.paymentAccountId, -ret.totalRefundAmount);
    }

    // Increase returned stock in Accounting Inventory (Completely segregated from web)
    const items = this.getInventoryItems();
    ret.items.forEach(item => {
      const found = items.find(p => (item.productId && p.id === item.productId) || p.name.toLowerCase().includes(item.productName.toLowerCase()));
      if (found) {
        found.stock = (found.stock || 0) + item.qty;
      }
    });
    this.saveInventoryItems(items, user);

    this.recordAuditLog(
      'create',
      'sales',
      ret.id,
      `Processed Sales Return #${ret.returnNumber} from Invoice #${ret.originalInvoiceNumber} (Rs. ${ret.totalRefundAmount})`,
      user
    );
    this.notifyChange();
  }

  // --- PURCHASES (PURCHASE INVOICES) ---
  static getPurchases(): PurchaseInvoice[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.PURCHASES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading purchases', e);
      return [];
    }
  }

  static getPurchaseById(id: string): PurchaseInvoice | undefined {
    return this.getPurchases().find(p => p.id === id);
  }

  static savePurchase(purchase: PurchaseInvoice, user = 'admin'): void {
    const purchases = this.getPurchases();
    const index = purchases.findIndex(p => p.id === purchase.id);
    const isNew = index < 0;
    const now = new Date().toISOString();

    if (isNew) {
      purchases.unshift({ ...purchase, createdAt: now, updatedAt: now });

      // 1. Adjust supplier balance (Due amount increases our payable to supplier)
      if (purchase.supplierId) {
        const supplier = this.getPartyById(purchase.supplierId);
        if (supplier) {
          supplier.currentBalance = (supplier.currentBalance || 0) + purchase.dueAmount;
          this.saveParty(supplier, user);
        }
      }

      // 2. Adjust payment account balance (Paid amount deducted from our account)
      if (purchase.paidAmount > 0 && purchase.paymentAccountId) {
        this.adjustAccountBalance(purchase.paymentAccountId, -purchase.paidAmount);
      }

      // 3. Connect with website product stock - increase inventory
      this.incrementProductInventory(purchase.items);

      // 4. Increment purchase sequence in settings
      const settings = this.getSettings();
      settings.nextPurchaseNumber = (settings.nextPurchaseNumber || 2000) + 1;
      localStorage.setItem(ACC_KEYS.SETTINGS, JSON.stringify(settings));

      this.recordAuditLog(
        'create',
        'purchase',
        purchase.id,
        `Created Purchase Bill #${purchase.invoiceNumber} from ${purchase.supplierName} (Rs. ${purchase.grandTotal})`,
        user
      );
    } else {
      const oldPurchase = purchases[index];
      purchases[index] = { ...purchase, updatedAt: now };

      // Reconcile supplier dues, payment account, and stock inventory if active
      if (oldPurchase.status === 'active' && purchase.status === 'active') {
        // 1. Reconcile Supplier Dues
        if (oldPurchase.supplierId === purchase.supplierId) {
          const deltaDue = Number(purchase.dueAmount || 0) - Number(oldPurchase.dueAmount || 0);
          if (deltaDue !== 0 && purchase.supplierId) {
            const supplier = this.getPartyById(purchase.supplierId);
            if (supplier) {
              supplier.currentBalance = Math.max(0, (supplier.currentBalance || 0) + deltaDue);
              this.saveParty(supplier, user);
            }
          }
        } else {
          // Supplier changed on the purchase bill
          if (oldPurchase.supplierId && oldPurchase.dueAmount > 0) {
            const oldSup = this.getPartyById(oldPurchase.supplierId);
            if (oldSup) {
              oldSup.currentBalance = Math.max(0, (oldSup.currentBalance || 0) - oldPurchase.dueAmount);
              this.saveParty(oldSup, user);
            }
          }
          if (purchase.supplierId && purchase.dueAmount > 0) {
            const newSup = this.getPartyById(purchase.supplierId);
            if (newSup) {
              newSup.currentBalance = (newSup.currentBalance || 0) + purchase.dueAmount;
              this.saveParty(newSup, user);
            }
          }
        }

        // 2. Reconcile Payment Account Balance (Paid amount to supplier is deducted from account)
        if (oldPurchase.paymentAccountId === purchase.paymentAccountId) {
          const deltaPaid = Number(purchase.paidAmount || 0) - Number(oldPurchase.paidAmount || 0);
          if (deltaPaid !== 0 && purchase.paymentAccountId) {
            this.adjustAccountBalance(purchase.paymentAccountId, -deltaPaid);
          }
        } else {
          if (oldPurchase.paidAmount > 0 && oldPurchase.paymentAccountId) {
            this.adjustAccountBalance(oldPurchase.paymentAccountId, oldPurchase.paidAmount);
          }
          if (purchase.paidAmount > 0 && purchase.paymentAccountId) {
            this.adjustAccountBalance(purchase.paymentAccountId, -purchase.paidAmount);
          }
        }

        // 3. Reconcile Stock Inventory (remove previously added stock, add newly updated stock)
        this.decrementProductInventory(oldPurchase.items);
        this.incrementProductInventory(purchase.items);
      }

      this.recordAuditLog(
        'edit',
        'purchase',
        purchase.id,
        `Updated Purchase Bill #${purchase.invoiceNumber} (${purchase.supplierName}, Rs. ${purchase.grandTotal})`,
        user
      );
    }

    localStorage.setItem(ACC_KEYS.PURCHASES, JSON.stringify(purchases));
    this.notifyChange();
  }

  static cancelPurchase(purchaseId: string, reason = '', user = 'admin'): boolean {
    const purchases = this.getPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase || purchase.status === 'cancelled') return false;

    purchase.status = 'cancelled';
    purchase.notes = (purchase.notes ? purchase.notes + ' | ' : '') + `Cancelled: ${reason}`;
    purchase.updatedAt = new Date().toISOString();

    // Reverse supplier due
    if (purchase.supplierId && purchase.dueAmount > 0) {
      const supplier = this.getPartyById(purchase.supplierId);
      if (supplier) {
        supplier.currentBalance = Math.max(0, (supplier.currentBalance || 0) - purchase.dueAmount);
        this.saveParty(supplier, user);
      }
    }

    // Reverse paid money
    if (purchase.paidAmount > 0 && purchase.paymentAccountId) {
      this.adjustAccountBalance(purchase.paymentAccountId, purchase.paidAmount);
    }

    // Deduct added stock
    this.decrementProductInventory(purchase.items);

    localStorage.setItem(ACC_KEYS.PURCHASES, JSON.stringify(purchases));
    this.recordAuditLog('cancel', 'purchase', purchase.id, `Cancelled Purchase Bill #${purchase.invoiceNumber}. Reason: ${reason}`, user);
    this.notifyChange();
    return true;
  }

  // --- PURCHASE RETURNS ---
  static getPurchaseReturns(): PurchaseReturn[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.PURCHASE_RETURNS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static savePurchaseReturn(ret: PurchaseReturn, user = 'admin'): void {
    const list = this.getPurchaseReturns();
    list.unshift(ret);
    localStorage.setItem(ACC_KEYS.PURCHASE_RETURNS, JSON.stringify(list));

    // Reduce supplier balance by debit amount
    if (ret.supplierId) {
      const supplier = this.getPartyById(ret.supplierId);
      if (supplier) {
        supplier.currentBalance = Math.max(0, (supplier.currentBalance || 0) - ret.totalDebitAmount);
        this.saveParty(supplier, user);
      }
    }

    // Deduct stock in Accounting Inventory (Completely segregated from web)
    const items = this.getInventoryItems();
    ret.items.forEach(item => {
      const found = items.find(p => (item.productId && p.id === item.productId) || p.name.toLowerCase().includes(item.productName.toLowerCase()));
      if (found) {
        found.stock = Math.max(0, (found.stock || 0) - item.qty);
      }
    });
    this.saveInventoryItems(items, user);

    this.recordAuditLog(
      'create',
      'purchase',
      ret.id,
      `Processed Purchase Return #${ret.returnNumber} to ${ret.supplierName} (Rs. ${ret.totalDebitAmount})`,
      user
    );
    this.notifyChange();
  }

  // --- RECEIPTS (PAYMENT RECEIVED FROM CUSTOMER) ---
  static getReceipts(): PaymentReceipt[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.RECEIPTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static saveReceipt(receipt: PaymentReceipt, user = 'admin'): void {
    const receipts = this.getReceipts();
    receipts.unshift(receipt);
    localStorage.setItem(ACC_KEYS.RECEIPTS, JSON.stringify(receipts));

    // Reduce customer receivable balance
    if (receipt.partyId) {
      const party = this.getPartyById(receipt.partyId);
      if (party) {
        party.currentBalance = Math.max(0, (party.currentBalance || 0) - receipt.amount);
        this.saveParty(party, user);
      }
    }

    // Increase payment account balance
    if (receipt.paymentAccountId && receipt.amount > 0) {
      this.adjustAccountBalance(receipt.paymentAccountId, receipt.amount);
    }

    // Increment receipt number sequence
    const settings = this.getSettings();
    settings.nextReceiptNumber = (settings.nextReceiptNumber || 3000) + 1;
    localStorage.setItem(ACC_KEYS.SETTINGS, JSON.stringify(settings));

    this.recordAuditLog(
      'create',
      'receipt',
      receipt.id,
      `Receipt #${receipt.receiptNumber} of Rs. ${receipt.amount} from ${receipt.partyName}`,
      user
    );
    this.notifyChange();
  }

  // --- PAYMENTS (PAYMENT MADE TO SUPPLIER / VENDOR) ---
  static getPayments(): PaymentVoucher[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static savePayment(payment: PaymentVoucher, user = 'admin'): void {
    const payments = this.getPayments();
    payments.unshift(payment);
    localStorage.setItem(ACC_KEYS.PAYMENTS, JSON.stringify(payments));

    // Reduce supplier payable balance
    if (payment.partyId) {
      const party = this.getPartyById(payment.partyId);
      if (party) {
        party.currentBalance = Math.max(0, (party.currentBalance || 0) - payment.amount);
        this.saveParty(party, user);
      }
    }

    // Deduct from payment account
    if (payment.paymentAccountId && payment.amount > 0) {
      this.adjustAccountBalance(payment.paymentAccountId, -payment.amount);
    }

    // Increment voucher number sequence
    const settings = this.getSettings();
    settings.nextPaymentNumber = (settings.nextPaymentNumber || 4000) + 1;
    localStorage.setItem(ACC_KEYS.SETTINGS, JSON.stringify(settings));

    this.recordAuditLog(
      'create',
      'payment',
      payment.id,
      `Payment Voucher #${payment.voucherNumber} of Rs. ${payment.amount} to ${payment.partyName}`,
      user
    );
    this.notifyChange();
  }

  // --- EXPENSES ---
  static getExpenses(): ExpenseRecord[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static saveExpense(expense: ExpenseRecord, user = 'admin'): void {
    const expenses = this.getExpenses();
    expenses.unshift(expense);
    localStorage.setItem(ACC_KEYS.EXPENSES, JSON.stringify(expenses));

    // Deduct expense from payment account
    if (expense.paymentAccountId && expense.amount > 0) {
      this.adjustAccountBalance(expense.paymentAccountId, -expense.amount);
    }

    // Increment expense sequence
    const settings = this.getSettings();
    settings.nextExpenseNumber = (settings.nextExpenseNumber || 5000) + 1;
    localStorage.setItem(ACC_KEYS.SETTINGS, JSON.stringify(settings));

    this.recordAuditLog(
      'create',
      'expense',
      expense.id,
      `Recorded Expense #${expense.expenseNumber} [${expense.category}] of Rs. ${expense.amount}`,
      user
    );
    this.notifyChange();
  }

  static deleteExpense(id: string, user = 'admin'): boolean {
    const expenses = this.getExpenses();
    const target = expenses.find(e => e.id === id);
    if (!target) return false;

    // Refund account
    if (target.paymentAccountId && target.amount > 0) {
      this.adjustAccountBalance(target.paymentAccountId, target.amount);
    }

    const filtered = expenses.filter(e => e.id !== id);
    localStorage.setItem(ACC_KEYS.EXPENSES, JSON.stringify(filtered));
    this.recordAuditLog('delete', 'expense', id, `Deleted expense: Rs. ${target.amount} (${target.category})`, user);
    this.notifyChange();
    return true;
  }

  // --- USERS & PERMISSIONS ---
  static getUsers(): AccountingUserPermission[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.USERS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(ACC_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }

  static saveUser(user: AccountingUserPermission, actor = 'admin'): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
      this.recordAuditLog('edit', 'party', user.id, `Updated accounting user: ${user.username}`, actor);
    } else {
      users.push(user);
      this.recordAuditLog('create', 'party', user.id, `Created accounting user: ${user.username}`, actor);
    }
    localStorage.setItem(ACC_KEYS.USERS, JSON.stringify(users));
    this.notifyChange();
  }

  static deleteUser(id: string, actor = 'admin'): boolean {
    const users = this.getUsers();
    if (users.length <= 1) {
      alert('कम्तिमा एक जना मुख्य प्रशासक (Admin) हुनै पर्छ।');
      return false;
    }
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(ACC_KEYS.USERS, JSON.stringify(filtered));
    this.recordAuditLog('delete', 'party', id, `Removed user permission ${id}`, actor);
    this.notifyChange();
    return true;
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AccountingAuditLog[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static recordAuditLog(
    action: AccountingAuditLog['action'],
    entity: AccountingAuditLog['entity'],
    entityId: string,
    details: string,
    userName = 'admin',
    userRole = 'Admin'
  ): void {
    const logs = this.getAuditLogs();
    const entry: AccountingAuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userName,
      userRole,
      action,
      entity,
      entityId,
      details
    };
    logs.unshift(entry);
    // Keep last 300 logs for audit performance
    const trimmed = logs.slice(0, 300);
    localStorage.setItem(ACC_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
  }

  // --- DEDICATED ACCOUNTING INVENTORY & ITEMS (100% ISOLATED FROM WEBSITE) ---
  static getInventoryItems(): Product[] {
    try {
      const data = localStorage.getItem(ACC_KEYS.INVENTORY);
      if (!data) {
        // Initialize an independent clone for accounting so it doesn't touch storefront
        const initialClone: Product[] = JSON.parse(JSON.stringify(initialProducts));
        localStorage.setItem(ACC_KEYS.INVENTORY, JSON.stringify(initialClone));
        return initialClone;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading accounting inventory items', e);
      return [];
    }
  }

  static saveInventoryItems(items: Product[], actor = 'admin'): void {
    try {
      localStorage.setItem(ACC_KEYS.INVENTORY, JSON.stringify(items));
      this.recordAuditLog('edit', 'inventory', 'bulk', `Saved ${items.length} accounting inventory items`, actor);
      this.notifyChange();
    } catch (e) {
      console.error('Error saving accounting inventory items', e);
    }
  }

  static saveInventoryItem(item: Product, actor = 'admin'): Product {
    try {
      const items = this.getInventoryItems();
      const existingIndex = items.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        items[existingIndex] = item;
        this.recordAuditLog('edit', 'inventory', item.id, `Updated accounting item: ${item.name}`, actor);
      } else {
        items.unshift(item);
        this.recordAuditLog('create', 'inventory', item.id, `Created accounting item: ${item.name}`, actor);
      }
      localStorage.setItem(ACC_KEYS.INVENTORY, JSON.stringify(items));
      this.notifyChange();
      return item;
    } catch (e) {
      console.error('Error saving accounting inventory item', e);
      return item;
    }
  }

  static updateInventoryItem(id: string, updates: Partial<Product>, actor = 'admin'): Product | null {
    try {
      const items = this.getInventoryItems();
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return null;
      const updated = { ...items[index], ...updates };
      items[index] = updated;
      localStorage.setItem(ACC_KEYS.INVENTORY, JSON.stringify(items));
      this.recordAuditLog('edit', 'inventory', id, `Updated accounting item: ${updated.name}`, actor);
      this.notifyChange();
      return updated;
    } catch (e) {
      console.error('Error updating accounting inventory item', e);
      return null;
    }
  }

  static deleteInventoryItem(id: string, actor = 'admin'): boolean {
    try {
      const items = this.getInventoryItems();
      const target = items.find(i => i.id === id);
      const filtered = items.filter(i => i.id !== id);
      localStorage.setItem(ACC_KEYS.INVENTORY, JSON.stringify(filtered));
      this.recordAuditLog('delete', 'inventory', id, `Deleted accounting item: ${target?.name || id}`, actor);
      this.notifyChange();
      return true;
    } catch (e) {
      console.error('Error deleting accounting inventory item', e);
      return false;
    }
  }

  static updateInventoryStock(id: string, newStock: number, actor = 'admin'): void {
    try {
      const items = this.getInventoryItems();
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return;
      const current = items[index];
      const validStock = Math.max(0, newStock);
      items[index] = {
        ...current,
        stock: validStock,
        availability: validStock > 0 ? (current.availability === 'Out of Stock' ? 'In Stock' : current.availability) : 'Out of Stock'
      };
      localStorage.setItem(ACC_KEYS.INVENTORY, JSON.stringify(items));
      this.recordAuditLog('edit', 'inventory', id, `Adjusted accounting stock for ${current.name} to ${validStock}`, actor);
      this.notifyChange();
    } catch (e) {
      console.error('Error updating accounting inventory stock', e);
    }
  }

  // --- INTERNAL INVENTORY HELPERS (AFFECTS ONLY ACCOUNTING LEDGER) ---
  private static decrementProductInventory(items: { productId?: string; productName: string; qty: number }[]): void {
    const products = this.getInventoryItems();
    let changed = false;

    items.forEach(item => {
      let match = item.productId ? products.find(p => p.id === item.productId) : null;
      if (!match) {
        match = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
      }
      if (match) {
        match.stock = Math.max(0, (match.stock || 0) - item.qty);
        changed = true;
      }
    });

    if (changed) {
      this.saveInventoryItems(products, 'system-sales');
    }
  }

  private static incrementProductInventory(items: { productId?: string; productName: string; qty: number; brand?: string; purchaseCost?: number; expectedSellingPrice?: number }[]): void {
    const products = this.getInventoryItems();
    let changed = false;

    items.forEach(item => {
      let match = item.productId ? products.find(p => p.id === item.productId) : null;
      if (!match) {
        match = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
      }
      if (match) {
        match.stock = (match.stock || 0) + item.qty;
        changed = true;
      } else if (item.productName && item.productName.trim()) {
        const cost = item.purchaseCost || 0;
        const retail = item.expectedSellingPrice || (cost > 0 ? Math.round(cost * 1.15) : 10000);
        const newItem: Product = {
          id: 'acc_item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: item.productName.trim(),
          brand: item.brand || 'Apple',
          category: 'Smartphones',
          condition: 'New',
          price: retail,
          costPrice: cost,
          stock: item.qty || 1,
          availability: 'In Stock',
          image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
          warranty: '1 Year Brand Warranty',
          description: `Imported via Purchase Invoice on ${new Date().toLocaleDateString()}`
        };
        products.unshift(newItem);
        changed = true;
      }
    });

    if (changed) {
      this.saveInventoryItems(products, 'system-purchase');
    }
  }

  // --- PARTY STATEMENT GENERATION (LEDGER) ---
  static getPartyLedger(partyId: string): PartyTransactionStatement[] {
    return this.getPartyStatement(partyId);
  }

  static getPartyStatement(partyId: string): PartyTransactionStatement[] {
    const party = this.getPartyById(partyId);
    if (!party) return [];

    const statements: PartyTransactionStatement[] = [];
    let runningBalance = 0;

    // 1. Opening Balance
    if (party.openingBalance > 0) {
      const isDr = party.openingBalanceType === 'dr';
      runningBalance = isDr ? party.openingBalance : -party.openingBalance;
      statements.push({
        date: party.createdAt.slice(0, 10),
        refType: 'Opening Balance',
        refNumber: 'OB-001',
        description: 'Opening Balance (सुरुको बाँकी)',
        debit: isDr ? party.openingBalance : 0,
        credit: !isDr ? party.openingBalance : 0,
        balance: runningBalance
      });
    }

    if (party.type === 'customer') {
      // Invoices
      const sales = this.getSalesInvoices().filter(s => s.customerId === partyId && s.status !== 'cancelled');
      sales.forEach(s => {
        runningBalance += s.grandTotal;
        statements.push({
          date: s.invoiceDate,
          refType: 'Sales Invoice',
          refNumber: s.invoiceNumber,
          description: `Sales: ${s.items.map(i => i.productName).join(', ')}`,
          debit: s.grandTotal,
          credit: 0,
          balance: runningBalance
        });

        if (s.paidAmount > 0) {
          runningBalance -= s.paidAmount;
          statements.push({
            date: s.invoiceDate,
            refType: 'Receipt',
            refNumber: s.invoiceNumber,
            description: `Payment Received on invoice (${s.paymentMethod})`,
            debit: 0,
            credit: s.paidAmount,
            balance: runningBalance
          });
        }
      });

      // Customer Receipts
      const receipts = this.getReceipts().filter(r => r.partyId === partyId);
      receipts.forEach(r => {
        runningBalance -= r.amount;
        statements.push({
          date: r.date,
          refType: 'Receipt',
          refNumber: r.receiptNumber,
          description: `Direct Payment Received (${r.paymentMethod}) ${r.remarks ? ' - ' + r.remarks : ''}`,
          debit: 0,
          credit: r.amount,
          balance: runningBalance
        });
      });

      // Sales Returns
      const returns = this.getSalesReturns().filter(r => r.customerId === partyId);
      returns.forEach(r => {
        runningBalance -= r.totalRefundAmount;
        statements.push({
          date: r.returnDate,
          refType: 'Sales Return',
          refNumber: r.returnNumber,
          description: `Return refund (${r.remarks || 'Items returned'})`,
          debit: 0,
          credit: r.totalRefundAmount,
          balance: runningBalance
        });
      });
    } else {
      // Supplier statement
      const purchases = this.getPurchases().filter(p => p.supplierId === partyId && p.status !== 'cancelled');
      purchases.forEach(p => {
        runningBalance += p.grandTotal;
        statements.push({
          date: p.invoiceDate,
          refType: 'Purchase Invoice',
          refNumber: p.invoiceNumber,
          description: `Purchase: ${p.items.map(i => i.productName).join(', ')}`,
          debit: 0,
          credit: p.grandTotal,
          balance: runningBalance
        });

        if (p.paidAmount > 0) {
          runningBalance -= p.paidAmount;
          statements.push({
            date: p.invoiceDate,
            refType: 'Payment',
            refNumber: p.invoiceNumber,
            description: `Paid on Bill (${p.paymentMethod})`,
            debit: p.paidAmount,
            credit: 0,
            balance: runningBalance
          });
        }
      });

      // Supplier Payments
      const payments = this.getPayments().filter(p => p.partyId === partyId);
      payments.forEach(p => {
        runningBalance -= p.amount;
        statements.push({
          date: p.date,
          refType: 'Payment',
          refNumber: p.voucherNumber,
          description: `Direct Payment Voucher (${p.paymentMethod}) ${p.remarks ? ' - ' + p.remarks : ''}`,
          debit: p.amount,
          credit: 0,
          balance: runningBalance
        });
      });

      // Purchase Returns
      const pReturns = this.getPurchaseReturns().filter(r => r.supplierId === partyId);
      pReturns.forEach(r => {
        runningBalance -= r.totalDebitAmount;
        statements.push({
          date: r.returnDate,
          refType: 'Purchase Return',
          refNumber: r.returnNumber,
          description: `Debit Note (${r.remarks || 'Goods returned to supplier'})`,
          debit: r.totalDebitAmount,
          credit: 0,
          balance: runningBalance
        });
      });
    }

    // Sort statements by date
    return statements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // --- PRODUCT LEDGER GENERATION (ITEM STOCK STATEMENT / BIN CARD) ---
  static getProductLedger(productId: string): ProductLedgerSummary | null {
    const products = this.getInventoryItems();
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    const normName = (product.name || '').trim().toLowerCase();
    const entries: ProductLedgerEntry[] = [];
    const unitCost = product.costPrice || Math.round((product.price || 1000) * 0.85);

    // 1. Inwards from Purchases
    const purchases = this.getPurchases().filter(p => p.status !== 'cancelled');
    purchases.forEach(pur => {
      pur.items.forEach((item, idx) => {
        const matches = (item.productId && item.productId === product.id) ||
          (item.productName && item.productName.trim().toLowerCase() === normName);
        if (matches) {
          const qty = item.qty || 1;
          const rate = item.purchaseCost || unitCost;
          entries.push({
            id: `pur_${pur.id}_${idx}`,
            date: pur.invoiceDate,
            type: 'Purchase Inward',
            refNumber: pur.invoiceNumber + (pur.billNumber ? ` (Bill: ${pur.billNumber})` : ''),
            partyName: pur.supplierName || 'Supplier',
            partyType: 'Supplier',
            imei: item.imeiOrSerial,
            inwardQty: qty,
            inwardRate: rate,
            inwardTotal: qty * rate,
            outwardQty: 0,
            outwardRate: 0,
            outwardTotal: 0,
            balanceQty: 0,
            balanceValue: 0,
            remarks: `खरिद दाखिला (Cost: Rs. ${rate.toLocaleString()})`
          });
        }
      });
    });

    // 2. Outwards from Sales Invoices
    const sales = this.getSalesInvoices().filter(s => s.status !== 'cancelled');
    sales.forEach(inv => {
      inv.items.forEach((item, idx) => {
        const matches = (item.productId && item.productId === product.id) ||
          (item.productName && item.productName.trim().toLowerCase() === normName);
        if (matches) {
          const qty = item.qty || 1;
          const rate = item.rate || product.price;
          const cost = item.purchaseCost || unitCost;
          const profit = (rate - cost) * qty;
          entries.push({
            id: `sale_${inv.id}_${idx}`,
            date: inv.invoiceDate,
            type: 'Sales Outward',
            refNumber: inv.invoiceNumber,
            partyName: inv.customerName || 'Walk-in Customer',
            partyType: 'Customer',
            imei: item.imeiOrSerial,
            inwardQty: 0,
            inwardRate: 0,
            inwardTotal: 0,
            outwardQty: qty,
            outwardRate: rate,
            outwardTotal: qty * rate,
            profitEarned: profit,
            balanceQty: 0,
            balanceValue: 0,
            remarks: `बिक्री निकासी (Profit: Rs. ${profit.toLocaleString()})`
          });
        }
      });
    });

    // 3. Inwards from Sales Returns
    const salesReturns = this.getSalesReturns();
    salesReturns.forEach(ret => {
      ret.items.forEach((item, idx) => {
        const matches = item.productName && item.productName.trim().toLowerCase().includes(normName);
        if (matches) {
          const qty = item.qty || 1;
          const rate = item.refundRate || product.price;
          entries.push({
            id: `sret_${ret.id}_${idx}`,
            date: ret.returnDate,
            type: 'Sales Return Inward',
            refNumber: ret.returnNumber,
            partyName: ret.customerName || 'Customer',
            partyType: 'Customer',
            imei: item.imeiOrSerial,
            inwardQty: qty,
            inwardRate: rate,
            inwardTotal: qty * rate,
            outwardQty: 0,
            outwardRate: 0,
            outwardTotal: 0,
            balanceQty: 0,
            balanceValue: 0,
            remarks: `बिक्री फिर्ता दाखिला (${item.reason || ret.remarks || 'Customer Return'})`
          });
        }
      });
    });

    // 4. Outwards from Purchase Returns
    const purchaseReturns = this.getPurchaseReturns();
    purchaseReturns.forEach(pret => {
      pret.items.forEach((item, idx) => {
        const matches = item.productName && item.productName.trim().toLowerCase().includes(normName);
        if (matches) {
          const qty = item.qty || 1;
          const rate = item.returnCost || unitCost;
          entries.push({
            id: `pret_${pret.id}_${idx}`,
            date: pret.returnDate,
            type: 'Purchase Return Outward',
            refNumber: pret.returnNumber,
            partyName: pret.supplierName || 'Supplier',
            partyType: 'Supplier',
            imei: item.imeiOrSerial,
            inwardQty: 0,
            inwardRate: 0,
            inwardTotal: 0,
            outwardQty: qty,
            outwardRate: rate,
            outwardTotal: qty * rate,
            balanceQty: 0,
            balanceValue: 0,
            remarks: `खरिद फिर्ता निकासी (${item.reason || pret.remarks || 'Supplier Return'})`
          });
        }
      });
    });

    // Sort chronologically by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate total inward and outward from recorded transactions
    const totalInwardVoucher = entries.reduce((acc, e) => acc + e.inwardQty, 0);
    const totalOutwardVoucher = entries.reduce((acc, e) => acc + e.outwardQty, 0);
    const netVoucherQty = totalInwardVoucher - totalOutwardVoucher;

    // Determine Opening Stock
    const currentStock = typeof product.stock === 'number' ? product.stock : 0;
    const openingStockQty = Math.max(0, currentStock - netVoucherQty);

    if (openingStockQty > 0 || entries.length === 0) {
      entries.unshift({
        id: `ob_${product.id}`,
        date: product.createdAt ? product.createdAt.slice(0, 10) : '2081-01-01',
        type: 'Opening Stock',
        refNumber: 'OPN-STOCK',
        partyName: 'सुरुवाती मौज्दात (Opening Stock)',
        partyType: 'Internal',
        inwardQty: openingStockQty,
        inwardRate: unitCost,
        inwardTotal: openingStockQty * unitCost,
        outwardQty: 0,
        outwardRate: 0,
        outwardTotal: 0,
        balanceQty: openingStockQty,
        balanceValue: openingStockQty * unitCost,
        remarks: 'सुरुवाती मौज्दात मौजुदा स्टक'
      });
    }

    // Recalculate running balance quantity and valuation
    let runningQty = 0;
    entries.forEach(e => {
      runningQty = runningQty + e.inwardQty - e.outwardQty;
      e.balanceQty = Math.max(0, runningQty);
      e.balanceValue = e.balanceQty * unitCost;
    });

    const totalInwardQty = entries.reduce((acc, e) => acc + e.inwardQty, 0);
    const totalInwardValue = entries.reduce((acc, e) => acc + e.inwardTotal, 0);
    const totalOutwardQty = entries.reduce((acc, e) => acc + e.outwardQty, 0);
    const totalOutwardValue = entries.reduce((acc, e) => acc + e.outwardTotal, 0);
    const totalGrossProfit = entries.reduce((acc, e) => acc + (e.profitEarned || 0), 0);

    return {
      productId: product.id,
      productName: product.name,
      brand: product.brand || 'Other',
      model: product.model || '',
      currentStock,
      costPrice: unitCost,
      sellingPrice: product.discountPrice || product.price,
      totalInwardQty,
      totalInwardValue,
      totalOutwardQty,
      totalOutwardValue,
      totalGrossProfit,
      entries
    };
  }

  // --- DASHBOARD FINANCIAL METRICS ---
  static getFinancialMetrics() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

    const sales = this.getSalesInvoices().filter(s => s.status === 'active');
    const purchases = this.getPurchases().filter(p => p.status === 'active');
    const expenses = this.getExpenses();
    const customers = this.getParties('customer');
    const suppliers = this.getParties('supplier');
    const accounts = this.getAccounts();

    // Aggregates
    const totalSales = sales.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalPurchase = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    const totalReceivable = customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
    const totalPayable = suppliers.reduce((acc, s) => acc + (s.currentBalance > 0 ? s.currentBalance : 0), 0);

    const cashAccount = accounts.find(a => a.accountType === 'cash');
    const cashBalance = cashAccount ? cashAccount.currentBalance : 0;
    const bankBalance = accounts
      .filter(a => a.accountType !== 'cash')
      .reduce((acc, a) => acc + a.currentBalance, 0);

    // Today's metrics
    const todaySales = sales.filter(s => s.invoiceDate === todayStr);
    const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
    const todaySalesCost = todaySales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
    const todayProfit = todaySalesTotal - todaySalesCost;

    const todayPurchases = purchases.filter(p => p.invoiceDate === todayStr);
    const todayPurchaseTotal = todayPurchases.reduce((acc, p) => acc + p.grandTotal, 0);

    const todayExpenses = expenses.filter(e => e.date === todayStr);
    const todayExpenseTotal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Monthly metrics
    const monthlySales = sales
      .filter(s => s.invoiceDate.startsWith(thisMonthStr))
      .reduce((acc, s) => acc + s.grandTotal, 0);

    const monthlyPurchases = purchases
      .filter(p => p.invoiceDate.startsWith(thisMonthStr))
      .reduce((acc, p) => acc + p.grandTotal, 0);

    const monthlyExpenses = expenses
      .filter(e => e.date.startsWith(thisMonthStr))
      .reduce((acc, e) => acc + e.amount, 0);

    // Overall profit & loss
    const totalCostOfGoodsSold = sales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
    const grossProfit = totalSales - totalCostOfGoodsSold;
    const netProfitOrLoss = grossProfit - totalExpenses;

    return {
      totalSales,
      totalPurchase,
      totalExpenses,
      totalReceivable,
      totalPayable,
      cashBalance,
      bankBalance,
      todaySales: todaySalesTotal,
      todayPurchase: todayPurchaseTotal,
      todayExpenses: todayExpenseTotal,
      todayProfit,
      monthlySales,
      monthlyPurchase: monthlyPurchases,
      monthlyExpenses,
      grossProfit,
      netProfitOrLoss,
      salesCount: sales.length,
      purchaseCount: purchases.length,
      customerCount: customers.length,
      supplierCount: suppliers.length
    };
  }

  // --- DEDICATED IMEI BHANDARAN (VAULT / REPOSITORY) ---
  static getImeiVault(): ImeiVaultItem[] {
    try {
      const stored = localStorage.getItem(ACC_KEYS.IMEI_VAULT);
      const explicitVault: ImeiVaultItem[] = stored ? JSON.parse(stored) : [];
      const map = new Map<string, ImeiVaultItem>();

      // Populate from explicitly saved items in the vault first
      explicitVault.forEach(item => {
        if (item.imei && item.imei.trim()) {
          map.set(item.imei.trim().toLowerCase(), { ...item, imei: item.imei.trim() });
        }
      });

      // Track sold IMEIs from Sales Invoices
      const soldMap = new Map<string, { inv: string; date: string; customer: string; phone?: string }>();
      const sales = this.getSalesInvoices().filter(s => s.status !== 'cancelled');
      sales.forEach(inv => {
        inv.items.forEach(it => {
          if (it.imeiOrSerial && it.imeiOrSerial.trim()) {
            soldMap.set(it.imeiOrSerial.trim().toLowerCase(), {
              inv: inv.invoiceNumber,
              date: inv.invoiceDate,
              customer: inv.customerName,
              phone: inv.customerPhone
            });
          }
        });
      });

      // Consolidate inwards from Purchases
      const purchases = this.getPurchases();
      purchases.forEach(pur => {
        pur.items.forEach(it => {
          if (it.imeiOrSerial && it.imeiOrSerial.trim()) {
            const key = it.imeiOrSerial.trim().toLowerCase();
            const soldInfo = soldMap.get(key);
            const existing = map.get(key);

            if (!existing) {
              map.set(key, {
                id: `imei_vault_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
                imei: it.imeiOrSerial.trim(),
                productId: it.productId,
                productName: it.productName,
                brand: it.brand || 'Handset',
                model: it.model || it.productName,
                status: soldInfo ? 'Sold' : 'In Stock',
                purchaseCost: it.purchaseCost,
                purchaseBill: pur.invoiceNumber,
                purchaseDate: pur.invoiceDate,
                supplierName: pur.supplierName,
                salesInvoice: soldInfo?.inv,
                salesDate: soldInfo?.date,
                customerName: soldInfo?.customer,
                customerPhone: soldInfo?.phone,
                createdAt: pur.createdAt || pur.invoiceDate,
                updatedAt: pur.updatedAt || pur.invoiceDate
              });
            } else {
              // Enhance existing item with invoice info if not set
              if (soldInfo && existing.status !== 'Under Repair' && existing.status !== 'Reserved') {
                existing.status = 'Sold';
                if (!existing.salesInvoice) existing.salesInvoice = soldInfo.inv;
                if (!existing.salesDate) existing.salesDate = soldInfo.date;
                if (!existing.customerName) existing.customerName = soldInfo.customer;
                if (!existing.customerPhone) existing.customerPhone = soldInfo.phone;
              }
              if (!existing.purchaseBill && pur.invoiceNumber) {
                existing.purchaseBill = pur.invoiceNumber;
                existing.purchaseDate = pur.invoiceDate;
                existing.supplierName = pur.supplierName;
              }
            }
          }
        });
      });

      // Also ensure any sold IMEI not in purchases is accounted for
      soldMap.forEach((soldInfo, key) => {
        const existing = map.get(key);
        if (existing) {
          if (existing.status !== 'Under Repair' && existing.status !== 'Reserved') {
            existing.status = 'Sold';
            existing.salesInvoice = existing.salesInvoice || soldInfo.inv;
            existing.salesDate = existing.salesDate || soldInfo.date;
            existing.customerName = existing.customerName || soldInfo.customer;
            existing.customerPhone = existing.customerPhone || soldInfo.phone;
          }
        }
      });

      return Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    } catch (err) {
      console.error('Error getting IMEI vault:', err);
      return [];
    }
  }

  static saveImeiVaultItem(item: ImeiVaultItem, user = 'Admin'): void {
    try {
      const stored = localStorage.getItem(ACC_KEYS.IMEI_VAULT);
      const list: ImeiVaultItem[] = stored ? JSON.parse(stored) : [];
      const trimmedImei = item.imei.trim();
      const existingIdx = list.findIndex(
        i => i.id === item.id || (i.imei && i.imei.trim().toLowerCase() === trimmedImei.toLowerCase())
      );

      const now = new Date().toISOString();
      const recordToSave: ImeiVaultItem = {
        ...item,
        imei: trimmedImei,
        updatedAt: now,
        createdAt: item.createdAt || now
      };

      if (existingIdx >= 0) {
        list[existingIdx] = recordToSave;
        this.recordAuditLog('edit', 'inventory', recordToSave.id, `Updated IMEI record ${trimmedImei} in vault`, user);
      } else {
        list.unshift(recordToSave);
        this.recordAuditLog('create', 'inventory', recordToSave.id, `Registered new IMEI ${trimmedImei} in vault`, user);
      }

      localStorage.setItem(ACC_KEYS.IMEI_VAULT, JSON.stringify(list));
      this.notifyChange();
    } catch (err) {
      console.error('Error saving IMEI vault item:', err);
    }
  }

  static deleteImeiVaultItem(id: string, user = 'Admin'): void {
    try {
      const stored = localStorage.getItem(ACC_KEYS.IMEI_VAULT);
      const list: ImeiVaultItem[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter(i => i.id !== id);
      localStorage.setItem(ACC_KEYS.IMEI_VAULT, JSON.stringify(filtered));
      this.recordAuditLog('delete', 'inventory', id, `Deleted IMEI record ${id} from vault`, user);
      this.notifyChange();
    } catch (err) {
      console.error('Error deleting IMEI vault item:', err);
    }
  }

  static searchImeiVault(query: string): ImeiVaultItem[] {
    if (!query || !query.trim()) return [];
    const normalized = query
      .replace(/[\u0966-\u096F]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x0966 + 48))
      .replace(/[\uFF10-\uFF19]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 48))
      .trim()
      .toLowerCase();

    const all = this.getImeiVault();
    return all.filter(item => {
      const imeiNorm = item.imei.toLowerCase();
      const secNorm = item.secondaryImei?.toLowerCase() || '';
      const prodNorm = item.productName.toLowerCase();
      const brandNorm = item.brand.toLowerCase();
      const custNorm = item.customerName?.toLowerCase() || '';
      const supNorm = item.supplierName?.toLowerCase() || '';
      const purBillNorm = item.purchaseBill?.toLowerCase() || '';
      const saleInvNorm = item.salesInvoice?.toLowerCase() || '';

      return (
        imeiNorm.includes(normalized) ||
        secNorm.includes(normalized) ||
        prodNorm.includes(normalized) ||
        brandNorm.includes(normalized) ||
        custNorm.includes(normalized) ||
        supNorm.includes(normalized) ||
        purBillNorm.includes(normalized) ||
        saleInvNorm.includes(normalized)
      );
    });
  }

  // --- DEMO DATA PURGE & RESET ---
  static clearAllDemoAccountingData(user = 'admin'): void {
    try {
      localStorage.removeItem(ACC_KEYS.SALES);
      localStorage.removeItem(ACC_KEYS.SALES_RETURNS);
      localStorage.removeItem(ACC_KEYS.PURCHASES);
      localStorage.removeItem(ACC_KEYS.PURCHASE_RETURNS);
      localStorage.removeItem(ACC_KEYS.RECEIPTS);
      localStorage.removeItem(ACC_KEYS.PAYMENTS);
      localStorage.removeItem(ACC_KEYS.EXPENSES);
      localStorage.removeItem(ACC_KEYS.PARTIES);
      localStorage.removeItem(ACC_KEYS.TRANSFERS);
      localStorage.removeItem(ACC_KEYS.AUDIT_LOGS);

      // Reset bank/cash accounts balances to zero
      const resetAccounts: BankAccount[] = DEFAULT_ACCOUNTS.map(a => ({
        ...a,
        openingBalance: 0,
        currentBalance: 0
      }));
      localStorage.setItem(ACC_KEYS.ACCOUNTS, JSON.stringify(resetAccounts));

      // Reset invoice series numbers
      const settings = this.getSettings();
      settings.nextInvoiceNumber = 1001;
      settings.nextPurchaseNumber = 2001;
      settings.nextReceiptNumber = 3001;
      settings.nextPaymentNumber = 4001;
      settings.nextExpenseNumber = 5001;
      localStorage.setItem(ACC_KEYS.SETTINGS, JSON.stringify(settings));

      this.recordAuditLog('delete', 'settings', 'all', 'Cleared all demo accounting data & reset ledger balances', user);
      this.notifyChange();
    } catch (err) {
      console.error('Error clearing accounting demo data:', err);
    }
  }
}

// Automatically purge demo data on startup to ensure a clean production accounting ledger
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem('pms_acc_demo_purged_v2')) {
      AccountingStorageService.clearAllDemoAccountingData('system');
      localStorage.setItem('pms_acc_demo_purged_v2', 'true');
    }
  } catch (e) {
    // Graceful fallback
  }
}
