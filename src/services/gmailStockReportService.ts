// Gmail Daily Stock Report Service for Pandey Mobile Store
// Allows Sending Full Inventory & Stock Valuation Reports via Google Gmail API
// Built with OAuth 2.0 (gmail.send scope) and RFC 2822 formatting

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, getCachedAccessToken, setCachedAccessToken } from '../lib/firebase.ts';
import { DataStorageService } from './dataStorage.ts';
import { AccountingStorageService } from './accountingStorage.ts';
import { Product } from '../types.ts';

export interface DailyStockReportData {
  generatedAt: string;
  reportDate: string;
  reportTime: string;
  nepaliDate: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  totalProductsCount: number;
  totalStockUnits: number;
  totalCostValuation: number;
  totalSellingValuation: number;
  unrealizedProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  brandSummary: {
    brand: string;
    units: number;
    costValuation: number;
  }[];
  todaySalesUnits: number;
  todaySalesRevenue: number;
  todayPurchasesUnits: number;
  todayPurchasesAmount: number;
  items: {
    id: string;
    name: string;
    brand: string;
    model: string;
    stock: number;
    costPrice: number;
    sellingPrice: number;
    totalCost: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
  }[];
}

export interface GmailStockReportHistoryItem {
  id: string;
  sentAt: string;
  recipientEmail: string;
  subject: string;
  totalItems: number;
  totalUnits: number;
  totalValuation: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  messageId?: string;
}

export interface GmailScheduleConfig {
  autoSendEnabled: boolean;
  senderEmail: string;
  recipientEmail: string;
  scheduledTime: string; // e.g. "21:00" for 9:00 PM
  lastSentDate?: string; // YYYY-MM-DD
  lastSentTimestamp?: string;
  includeItemizedList: boolean;
}

export type AutoScheduleEvent =
  | { type: 'dispatched'; recipient: string; time: string; messageId: string }
  | { type: 'pending_auth'; recipient: string; scheduledTime: string }
  | { type: 'error'; recipient: string; error: string };

const STORAGE_KEY_HISTORY = 'pms_gmail_stock_reports_history_v1';
const STORAGE_KEY_SCHEDULE = 'pms_gmail_daily_auto_schedule_v1';
export const DEFAULT_SENDER = 'pmesbutwal@gmail.com';
export const DEFAULT_RECIPIENT = 'rudra.pandey97050@gmail.com';
export const DEFAULT_SCHEDULED_TIME = '21:00'; // 9:00 PM

let schedulerIntervalId: any = null;
const schedulerListeners: Set<(event: AutoScheduleEvent) => void> = new Set();

export class GmailStockReportService {
  /**
   * Get cached OAuth token or null
   */
  static getAccessToken(): string | null {
    return getCachedAccessToken();
  }

  /**
   * Connect to Google Account with gmail.send permission
   */
  static async signInWithGoogle(): Promise<{ userEmail: string; token: string }> {
    if (!auth) {
      throw new Error('Google authentication service is not initialized.');
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error('Could not retrieve access token for Gmail. Please ensure popups are allowed in your browser.');
      }

      setCachedAccessToken(token);
      return {
        userEmail: result.user.email || DEFAULT_RECIPIENT,
        token,
      };
    } catch (error: any) {
      console.error('Google Sign-In for Gmail error:', error);
      throw new Error(error.message || 'Failed to authenticate with Google Account');
    }
  }

  /**
   * Compile complete real-time stock and movement data from local accounting and inventory
   */
  static generateStockReportData(): DailyStockReportData {
    const products = DataStorageService.getProducts();
    const storeSettings = DataStorageService.getStoreSettings();
    const accountingSettings = AccountingStorageService.getSettings();
    const todayStr = new Date().toISOString().slice(0, 10);

    // Sales today
    const salesToday = AccountingStorageService.getSalesInvoices().filter(
      s => s.invoiceDate === todayStr && s.status !== 'cancelled'
    );
    const todaySalesUnits = salesToday.reduce(
      (acc, s) => acc + s.items.reduce((sum, item) => sum + (item.qty || 1), 0),
      0
    );
    const todaySalesRevenue = salesToday.reduce((acc, s) => acc + s.grandTotal, 0);

    // Purchases today
    const purchasesToday = AccountingStorageService.getPurchases().filter(
      p => p.invoiceDate === todayStr && p.status !== 'cancelled'
    );
    const todayPurchasesUnits = purchasesToday.reduce(
      (acc, p) => acc + p.items.reduce((sum, item) => sum + (item.qty || 1), 0),
      0
    );
    const todayPurchasesAmount = purchasesToday.reduce((acc, p) => acc + p.grandTotal, 0);

    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalSellingValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const brandMap = new Map<string, { units: number; costValuation: number }>();

    const items = products.map(p => {
      const stock = typeof p.stock === 'number' ? p.stock : 0;
      const sellingPrice = p.discountPrice || p.price || 0;
      const costPrice = p.costPrice || Math.round(sellingPrice * 0.85);
      const totalCost = stock * costPrice;
      const totalSelling = stock * sellingPrice;

      totalStockUnits += stock;
      totalCostValuation += totalCost;
      totalSellingValuation += totalSelling;

      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (stock === 0) {
        outOfStockCount++;
        status = 'out_of_stock';
      } else if (stock <= 2) {
        lowStockCount++;
        status = 'low_stock';
      }

      const brandKey = (p.brand || 'Other').trim();
      const currentBrand = brandMap.get(brandKey) || { units: 0, costValuation: 0 };
      currentBrand.units += stock;
      currentBrand.costValuation += totalCost;
      brandMap.set(brandKey, currentBrand);

      return {
        id: p.id,
        name: p.name,
        brand: p.brand || 'Other',
        model: p.model || '',
        stock,
        costPrice,
        sellingPrice,
        totalCost,
        status,
      };
    });

    const brandSummary = Array.from(brandMap.entries())
      .map(([brand, data]) => ({
        brand,
        units: data.units,
        costValuation: data.costValuation,
      }))
      .sort((a, b) => b.costValuation - a.costValuation);

    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return {
      generatedAt: now.toISOString(),
      reportDate: todayStr,
      reportTime: timeFormatter.format(now),
      nepaliDate: '2081/82',
      storeName: accountingSettings.companyName || storeSettings.storeName || 'Pandey Mobile Store & Care',
      storeAddress: accountingSettings.address || storeSettings.address || 'Traffic Chowk, Butwal, Nepal',
      storePhone: accountingSettings.phone || storeSettings.phone1 || '9847460603',
      totalProductsCount: products.length,
      totalStockUnits,
      totalCostValuation,
      totalSellingValuation,
      unrealizedProfit: totalSellingValuation - totalCostValuation,
      lowStockCount,
      outOfStockCount,
      brandSummary,
      todaySalesUnits,
      todaySalesRevenue,
      todayPurchasesUnits,
      todayPurchasesAmount,
      items: items.sort((a, b) => b.totalCost - a.totalCost),
    };
  }

  /**
   * Construct high-end, responsive HTML Email for Gmail
   */
  static generateHtmlEmail(
    data: DailyStockReportData,
    senderEmail?: string,
    recipientEmail?: string
  ): string {
    const brandRows = data.brandSummary
      .map(
        b => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${b.brand}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #3b82f6;">${b.units.toLocaleString()}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">Rs. ${b.costValuation.toLocaleString()}</td>
        </tr>
      `
      )
      .join('');

    const itemRows = data.items
      .slice(0, 50)
      .map(item => {
        let badgeBg = '#dcfce7';
        let badgeColor = '#166534';
        let badgeText = 'In Stock';

        if (item.status === 'out_of_stock') {
          badgeBg = '#fee2e2';
          badgeColor = '#991b1b';
          badgeText = 'Sold Out';
        } else if (item.status === 'low_stock') {
          badgeBg = '#fef3c7';
          badgeColor = '#92400e';
          badgeText = `Low (${item.stock})`;
        }

        return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">
            ${item.name}
            <div style="font-size: 11px; color: #64748b; font-weight: normal;">${item.brand} ${item.model ? '• ' + item.model : ''}</div>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background-color: ${badgeBg}; color: ${badgeColor};">
              ${item.stock} (${badgeText})
            </span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #475569; font-size: 13px;">Rs. ${item.costPrice.toLocaleString()}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #059669; font-weight: 600; font-size: 13px;">Rs. ${item.sellingPrice.toLocaleString()}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #0f172a; font-size: 13px;">Rs. ${item.totalCost.toLocaleString()}</td>
        </tr>
      `;
      })
      .join('');

    const sender = (senderEmail || DEFAULT_SENDER).trim();
    const recipient = (recipientEmail || DEFAULT_RECIPIENT).trim();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Daily 9:00 PM Stock Report - ${data.storeName}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px 24px; color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
            📱 ${data.storeName}
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">
            ${data.storeAddress} • Tel: ${data.storePhone}
          </p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background-color: rgba(99, 102, 241, 0.25); border: 1px solid rgba(165, 180, 252, 0.3); padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; color: #e0e7ff;">
            DAILY 9:00 PM STOCK REPORT
          </span>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
            ${data.reportDate} • ${data.reportTime}
          </div>
        </div>
      </div>

      <!-- Sender & Receiver Routing Banner -->
      <div style="margin-top: 16px; padding: 10px 14px; background-color: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px; font-size: 11px; line-height: 1.6;">
        <table style="width: 100%; border-collapse: collapse; color: #e2e8f0;">
          <tr>
            <td style="padding: 2px 0;"><strong>Sender:</strong> <span style="color: #93c5fd;">${sender}</span></td>
            <td style="padding: 2px 0; text-align: right;"><strong>Auto Schedule:</strong> <span style="color: #fde047; font-weight: bold;">Daily 9:00 PM Always</span></td>
          </tr>
          <tr>
            <td style="padding: 2px 0;"><strong>Receiver:</strong> <span style="color: #86efac; font-weight: bold;">${recipient}</span></td>
            <td style="padding: 2px 0; text-align: right;"><strong>System:</strong> Official Accounting Platform</td>
          </tr>
        </table>
      </div>
    </div>

    <div style="padding: 24px;">

      <!-- Executive KPI Cards -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin-top: -10px;">
        <tr>
          <td style="background-color: #f1f5f9; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Total Units</div>
            <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px;">${data.totalStockUnits.toLocaleString()}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${data.totalProductsCount} Models</div>
          </td>
          <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; text-align: center; width: 35%;">
            <div style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase;">Stock Cost Valuation</div>
            <div style="font-size: 20px; font-weight: 800; color: #15803d; margin-top: 4px;">Rs. ${data.totalCostValuation.toLocaleString()}</div>
            <div style="font-size: 10px; color: #166534; margin-top: 2px;">Retail: Rs. ${data.totalSellingValuation.toLocaleString()}</div>
          </td>
          <td style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 14px; text-align: center; width: 40%;">
            <div style="font-size: 11px; font-weight: 600; color: #4338ca; text-transform: uppercase;">Today's Sales (आजको बिक्री)</div>
            <div style="font-size: 20px; font-weight: 800; color: #4f46e5; margin-top: 4px;">Rs. ${data.todaySalesRevenue.toLocaleString()}</div>
            <div style="font-size: 10px; color: #4338ca; margin-top: 2px;">${data.todaySalesUnits} Phone(s) Sold</div>
          </td>
        </tr>
      </table>

      <!-- Low Stock Warning (if any) -->
      ${
        data.lowStockCount > 0 || data.outOfStockCount > 0
          ? `
        <div style="margin: 18px 0; padding: 12px 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; display: flex; align-items: center;">
          <div style="font-size: 20px; margin-right: 12px;">⚠️</div>
          <div style="font-size: 12px; color: #92400e;">
            <strong>Inventory Attention Required:</strong> You currently have <strong>${data.lowStockCount} items with critical low stock (≤ 2 units)</strong> and <strong>${data.outOfStockCount} items completely sold out</strong>. Please re-order from suppliers accordingly.
          </div>
        </div>
      `
          : ''
      }

      <!-- Today's Movement & Flow -->
      <div style="margin-top: 20px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          📊 Today's Movement Summary (दैनिक कारोबार)
        </h3>
        <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; font-size: 13px;">
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #475569;">Stock Inward from Purchases (नयाँ खरिद):</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">
              +${data.todayPurchasesUnits} Units (Rs. ${data.todayPurchasesAmount.toLocaleString()})
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #475569;">Stock Outward from Sales (ग्राहकलाई बिक्री):</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #059669;">
              -${data.todaySalesUnits} Units (Revenue: Rs. ${data.todaySalesRevenue.toLocaleString()})
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #475569;">Unrealized Stock Margin (अनुमानित नाफा):</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: bold; color: #2563eb;">
              Rs. ${data.unrealizedProfit.toLocaleString()}
            </td>
          </tr>
        </table>
      </div>

      <!-- Brand Breakdown Table -->
      <div style="margin-top: 24px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          🏷️ Inventory Breakdown by Brand
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Brand</th>
              <th style="padding: 8px 14px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">In Stock Units</th>
              <th style="padding: 8px 14px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Valuation (Cost)</th>
            </tr>
          </thead>
          <tbody>
            ${brandRows}
          </tbody>
        </table>
      </div>

      <!-- Top Inventory Items Table -->
      <div style="margin-top: 28px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
            📦 Itemized Stock List (शीर्ष मौज्दात विवरण)
          </h3>
          <span style="font-size: 11px; color: #64748b;">Showing ${Math.min(data.items.length, 50)} of ${data.items.length} items</span>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase;">Product Name</th>
              <th style="padding: 8px 12px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase;">Stock</th>
              <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase;">Cost Price</th>
              <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase;">Selling Price</th>
              <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase;">Total Valuation</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      <!-- Closing Footer Note -->
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
        <p style="margin: 0 0 4px 0;">
          This is an automated daily report sent directly from <strong>Pandey Mobile Store Accounting Platform</strong>.
        </p>
        <p style="margin: 0;">
          Traffic Chowk, Butwal, Nepal • Contact: 9847460603 / 9857055743 • Official Store System
        </p>
      </div>

    </div>

  </div>
</body>
</html>`;
  }

  /**
   * Send the Daily Stock Report directly to Gmail using Google Workspace Gmail API
   */
  static async sendStockReport(options?: {
    recipientEmail?: string;
    senderEmail?: string;
    customSubject?: string;
    isAutoDispatched?: boolean;
    silentIfNoAuth?: boolean;
  }): Promise<{ messageId: string; recipient: string; subject: string; reportData: DailyStockReportData }> {
    let token = this.getAccessToken();

    // If no token cached, trigger Google sign-in popup
    if (!token) {
      if (options?.silentIfNoAuth) {
        throw new Error('Authentication required for automated background dispatch');
      }
      const authResult = await this.signInWithGoogle();
      token = authResult.token;
    }

    const config = this.getScheduleConfig();
    const reportData = this.generateStockReportData();
    const sender = (options?.senderEmail || config.senderEmail || DEFAULT_SENDER).trim();
    const recipient = (options?.recipientEmail || config.recipientEmail || DEFAULT_RECIPIENT).trim();
    const subjectPrefix = options?.isAutoDispatched ? '[Auto 9:00 PM Stock Report]' : '[Daily 9:00 PM Stock Report]';
    const subject =
      options?.customSubject ||
      `${subjectPrefix} ${reportData.storeName} - ${reportData.reportDate} (Valuation: Rs. ${reportData.totalCostValuation.toLocaleString()} | Units: ${reportData.totalStockUnits})`;

    const htmlContent = this.generateHtmlEmail(reportData, sender, recipient);

    // Format RFC 2822 standard email message with explicit Sender and Recipient
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const rfc2822 = [
      `To: ${recipient}`,
      `From: Pandey Mobile Store <${sender}>`,
      `Reply-To: ${sender}`,
      `Subject: ${utf8Subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      htmlContent,
    ].join('\r\n');

    // Base64URL encode
    const utf8Bytes = new TextEncoder().encode(rfc2822);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64UrlMessage = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: base64UrlMessage,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `Gmail API responded with status ${response.status}`;
        throw new Error(errMsg);
      }

      const sendResult = await response.json();
      const messageId = sendResult.id || `msg_${Date.now()}`;
      const now = new Date();

      // Save to history
      this.recordHistoryItem({
        id: messageId,
        sentAt: now.toISOString(),
        recipientEmail: recipient,
        subject,
        totalItems: reportData.totalProductsCount,
        totalUnits: reportData.totalStockUnits,
        totalValuation: reportData.totalCostValuation,
        status: 'success',
        messageId,
      });

      // Update schedule record
      const updatedConfig = this.getScheduleConfig();
      updatedConfig.lastSentDate = reportData.reportDate;
      updatedConfig.lastSentTimestamp = now.toISOString();
      this.saveScheduleConfig(updatedConfig);

      return {
        messageId,
        recipient,
        subject,
        reportData,
      };
    } catch (err: any) {
      console.error('Failed to dispatch stock report to Gmail:', err);

      this.recordHistoryItem({
        id: `err_${Date.now()}`,
        sentAt: new Date().toISOString(),
        recipientEmail: recipient,
        subject,
        totalItems: reportData.totalProductsCount,
        totalUnits: reportData.totalStockUnits,
        totalValuation: reportData.totalCostValuation,
        status: 'failed',
        errorMessage: err.message || String(err),
      });

      throw err;
    }
  }

  /**
   * History of dispatched stock reports
   */
  static getHistory(): GmailStockReportHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static recordHistoryItem(item: GmailStockReportHistoryItem): void {
    const history = this.getHistory();
    history.unshift(item);
    const limited = history.slice(0, 30); // Keep last 30 reports
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(limited));
  }

  /**
   * Schedule configuration for automated daily stock delivery at 9:00 PM
   */
  static getScheduleConfig(): GmailScheduleConfig {
    const defaultConfig: GmailScheduleConfig = {
      autoSendEnabled: true,
      senderEmail: DEFAULT_SENDER,
      recipientEmail: DEFAULT_RECIPIENT,
      scheduledTime: DEFAULT_SCHEDULED_TIME, // "21:00" = 9:00 PM
      includeItemizedList: true,
    };

    try {
      const data = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...defaultConfig,
          ...parsed,
          senderEmail: parsed.senderEmail || DEFAULT_SENDER,
          recipientEmail:
            parsed.recipientEmail === 'pmesbutwal@gmail.com'
              ? DEFAULT_RECIPIENT
              : (parsed.recipientEmail || DEFAULT_RECIPIENT),
          scheduledTime:
            parsed.scheduledTime === '20:00'
              ? DEFAULT_SCHEDULED_TIME
              : (parsed.scheduledTime || DEFAULT_SCHEDULED_TIME),
          autoSendEnabled: parsed.autoSendEnabled !== false,
        };
      }
    } catch (e) {}

    return defaultConfig;
  }

  static saveScheduleConfig(config: GmailScheduleConfig): void {
    localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(config));
  }

  /**
   * Subscribe a listener to auto-schedule events
   */
  static addSchedulerListener(listener: (event: AutoScheduleEvent) => void): () => void {
    schedulerListeners.add(listener);
    return () => {
      schedulerListeners.delete(listener);
    };
  }

  /**
   * Initialize automated daily ticker that runs every 30 seconds
   * Checks if current time is >= 21:00 (9:00 PM) and hasn't sent today
   */
  static initAutoScheduler(onEvent?: (event: AutoScheduleEvent) => void): () => void {
    if (onEvent) {
      schedulerListeners.add(onEvent);
    }

    if (!schedulerIntervalId && typeof window !== 'undefined') {
      setTimeout(() => {
        GmailStockReportService.runScheduledCheck();
      }, 1500);

      schedulerIntervalId = setInterval(() => {
        GmailStockReportService.runScheduledCheck();
      }, 30000);
    }

    return () => {
      if (onEvent) {
        schedulerListeners.delete(onEvent);
      }
    };
  }

  /**
   * Evaluates if 9:00 PM auto-send conditions are met and executes dispatch
   */
  static async runScheduledCheck(): Promise<boolean> {
    const config = this.getScheduleConfig();
    if (!config.autoSendEnabled) return false;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Already dispatched today
    if (config.lastSentDate === todayStr) {
      return false;
    }

    // Parse target scheduled time (21:00 / 9:00 PM)
    const [targetHour, targetMinute] = (config.scheduledTime || DEFAULT_SCHEDULED_TIME)
      .split(':')
      .map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const isTimeReached =
      currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

    if (!isTimeReached) {
      return false;
    }

    // Check if OAuth access token is active
    const token = this.getAccessToken();
    if (!token) {
      const event: AutoScheduleEvent = {
        type: 'pending_auth',
        recipient: config.recipientEmail || DEFAULT_RECIPIENT,
        scheduledTime: config.scheduledTime || DEFAULT_SCHEDULED_TIME,
      };
      schedulerListeners.forEach((l) => l(event));
      return false;
    }

    // Access token is available: Auto-dispatch immediately
    try {
      const result = await this.sendStockReport({
        recipientEmail: config.recipientEmail || DEFAULT_RECIPIENT,
        senderEmail: config.senderEmail || DEFAULT_SENDER,
        isAutoDispatched: true,
      });

      const event: AutoScheduleEvent = {
        type: 'dispatched',
        recipient: result.recipient,
        time: now.toLocaleTimeString(),
        messageId: result.messageId,
      };
      schedulerListeners.forEach((l) => l(event));
      return true;
    } catch (err: any) {
      console.error('Scheduled auto-send error:', err);
      const event: AutoScheduleEvent = {
        type: 'error',
        recipient: config.recipientEmail || DEFAULT_RECIPIENT,
        error: err.message || 'Auto send failed',
      };
      schedulerListeners.forEach((l) => l(event));
      return false;
    }
  }

  /**
   * Helper description for human readability
   */
  static getScheduleStatusText(): { label: string; isSentToday: boolean; nextTime: string } {
    const config = this.getScheduleConfig();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isSentToday = config.lastSentDate === todayStr;

    return {
      label: isSentToday
        ? `Sent today at ${config.lastSentTimestamp ? new Date(config.lastSentTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '9:00 PM'}`
        : `Scheduled Daily at ${config.scheduledTime === '21:00' ? '9:00 PM' : config.scheduledTime}`,
      isSentToday,
      nextTime: isSentToday ? 'Tomorrow 9:00 PM' : 'Today 9:00 PM',
    };
  }
}
