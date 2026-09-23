import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, getCachedAccessToken, setCachedAccessToken } from '../lib/firebase.ts';
import { RateListItem, PhoneValuationRequest, RepairBooking } from '../types.ts';

export interface GoogleSheetsHistoryItem {
  id: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  type: 'rate-list' | 'valuations' | 'repairs' | 'products';
  createdAt: string;
  rowCount: number;
}

const STORAGE_KEY_SHEETS_HISTORY = 'pms_google_sheets_history_v1';

export class GoogleSheetsService {
  /**
   * Returns current cached access token or null
   */
  static getAccessToken(): string | null {
    return getCachedAccessToken();
  }

  /**
   * Signs in with Google to obtain an access token with Google Sheets scopes
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
        throw new Error('Could not retrieve access token for Google Sheets. Please ensure popup blocker is disabled.');
      }

      setCachedAccessToken(token);
      return {
        userEmail: result.user.email || 'Connected Google User',
        token,
      };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw new Error(error.message || 'Failed to authenticate with Google');
    }
  }

  /**
   * Signs out from Google session and clears cached token
   */
  static async signOut(): Promise<void> {
    setCachedAccessToken(null);
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }

  /**
   * Exports Nepal iPhone Rate List to a new Google Spreadsheet
   */
  static async exportRateListToSheet(rateList: RateListItem[]): Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowCount: number }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not connected to Google. Please sign in with your Google account first.');
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const title = `Pandey Mobile Store - Nepal iPhone Rate List (${todayDate})`;

    // 1. Create Spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Used iPhone Price List',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
    }

    const created = await createRes.json();
    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Prepare Rows
    const headers = [
      'Model Name',
      'Storage',
      'Grade A Price (NPR)',
      'Grade B Price (NPR)',
      'Market Status',
      'Category',
      'Last Updated',
    ];

    const rows = rateList.map(item => [
      item.model,
      item.storage || '128GB',
      item.priceA || item.sellingPrice || 0,
      item.priceB || Math.round((item.sellingPrice || 0) * 0.9) || 0,
      item.status || 'Active',
      item.category || 'iPhone',
      item.lastUpdated || item.updatedAt || todayDate,
    ]);

    const values = [headers, ...rows];

    // 3. Populate Data
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Used iPhone Price List'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.error?.message || 'Failed to populate sheet data');
    }

    // Save to local history
    this.addToHistory({
      id: `sheet-${Date.now()}`,
      spreadsheetId,
      spreadsheetUrl,
      title,
      type: 'rate-list',
      createdAt: new Date().toISOString(),
      rowCount: rows.length,
    });

    return {
      spreadsheetId,
      spreadsheetUrl,
      rowCount: rows.length,
    };
  }

  /**
   * Exports customer phone valuations to Google Sheets
   */
  static async exportValuationsToSheet(valuations: PhoneValuationRequest[]): Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowCount: number }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not connected to Google. Please sign in with your Google account first.');
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const title = `Pandey Mobile Store - Customer Valuations (${todayDate})`;

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [
          {
            properties: {
              title: 'Valuation Inquiries',
              gridProperties: { frozenRowCount: 1 },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create valuation spreadsheet');
    }

    const created = await createRes.json();
    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    const headers = [
      'ID',
      'Date',
      'Customer Name',
      'Phone Number',
      'Device Model',
      'Storage',
      'Battery Health',
      'Body Condition',
      'Screen Condition',
      'Estimated Value (NPR)',
      'Status',
    ];

    const rows = valuations.map(v => [
      v.id,
      v.createdAt ? new Date(v.createdAt).toLocaleDateString() : todayDate,
      v.customerName || 'N/A',
      v.customerPhone || v.mobileNumber || 'N/A',
      v.model || v.phoneModel || 'N/A',
      v.storage || 'N/A',
      v.batteryHealth ? `${v.batteryHealth}%` : (v.condition?.batteryHealth || 'N/A'),
      v.bodyCondition || v.condition?.frameBody || 'N/A',
      v.screenCondition || v.condition?.frontDisplay || 'N/A',
      v.estimatedValue || v.finalValuationPrice || v.estimatedValuationPrice || 0,
      v.status || 'pending',
    ]);

    const values = [headers, ...rows];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Valuation Inquiries'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    this.addToHistory({
      id: `sheet-${Date.now()}`,
      spreadsheetId,
      spreadsheetUrl,
      title,
      type: 'valuations',
      createdAt: new Date().toISOString(),
      rowCount: rows.length,
    });

    return {
      spreadsheetId,
      spreadsheetUrl,
      rowCount: rows.length,
    };
  }

  /**
   * Exports repair bookings to Google Sheets
   */
  static async exportRepairsToSheet(repairs: RepairBooking[]): Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowCount: number }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not connected to Google. Please sign in with your Google account first.');
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const title = `Pandey Mobile Store - Repair Bookings (${todayDate})`;

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [
          {
            properties: {
              title: 'Repair Appointments',
              gridProperties: { frozenRowCount: 1 },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create repair bookings sheet');
    }

    const created = await createRes.json();
    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    const headers = [
      'Booking ID',
      'Date Booked',
      'Customer Name',
      'Phone Number',
      'Device Model',
      'Issue Description',
      'Estimated Cost (NPR)',
      'Preferred Date',
      'Status',
    ];

    const rows = repairs.map(r => [
      r.id,
      r.createdAt ? new Date(r.createdAt).toLocaleDateString() : todayDate,
      r.customerName || 'N/A',
      r.phone || r.phoneNumber || 'N/A',
      r.deviceModel || `${r.mobileBrand || ''} ${r.mobileModel || ''}`.trim() || 'N/A',
      r.issue || r.problemType || r.problemDescription || 'N/A',
      r.estimatedCost || r.finalPrice || r.tentativePrice || 0,
      r.preferredDate || 'N/A',
      r.status || 'pending',
    ]);

    const values = [headers, ...rows];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Repair Appointments'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    this.addToHistory({
      id: `sheet-${Date.now()}`,
      spreadsheetId,
      spreadsheetUrl,
      title,
      type: 'repairs',
      createdAt: new Date().toISOString(),
      rowCount: rows.length,
    });

    return {
      spreadsheetId,
      spreadsheetUrl,
      rowCount: rows.length,
    };
  }

  /**
   * Imports rate list from an existing Google Sheet
   */
  static async importRateListFromSheet(spreadsheetId: string, range = 'A2:G100'): Promise<Partial<RateListItem>[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not connected to Google. Please sign in with your Google account first.');
    }

    const cleanId = spreadsheetId.includes('/d/') 
      ? spreadsheetId.split('/d/')[1].split('/')[0] 
      : spreadsheetId.trim();

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to read data from Google Sheet');
    }

    const data = await res.json();
    const rows: any[][] = data.values || [];

    const imported: Partial<RateListItem>[] = rows
      .filter(row => row && row[0])
      .map(row => ({
        model: String(row[0] || '').trim(),
        storage: String(row[1] || '128GB').trim(),
        priceA: parseInt(String(row[2] || '0').replace(/[^0-9]/g, ''), 10) || 0,
        priceB: parseInt(String(row[3] || '0').replace(/[^0-9]/g, ''), 10) || 0,
        status: (row[4] === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
        category: (row[5] || 'iPhone') as any,
        lastUpdated: new Date().toISOString().split('T')[0],
      }));

    return imported;
  }

  /**
   * Retrieves previously exported sheets
   */
  static getHistory(): GoogleSheetsHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SHEETS_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static addToHistory(item: GoogleSheetsHistoryItem): void {
    try {
      const list = this.getHistory();
      list.unshift(item);
      // Keep last 25
      const capped = list.slice(0, 25);
      localStorage.setItem(STORAGE_KEY_SHEETS_HISTORY, JSON.stringify(capped));
    } catch (e) {
      console.warn('Could not update sheets history', e);
    }
  }

  static clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY_SHEETS_HISTORY);
  }
}
