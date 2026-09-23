import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../lib/firebase.ts';
import {
  Product,
  RateListItem,
  RepairBooking,
  PhoneValuationRequest,
  StoreSettings,
  UpcomingModel,
  PreBookingRequest,
  CustomerOrder
} from '../types.ts';
import { DataStorageService } from './dataStorage.ts';

export class FirestoreService {
  private static isAvailable = true;
  private static hasTestedConnection = false;

  static async initConnection(): Promise<boolean> {
    if (this.hasTestedConnection) return this.isAvailable;
    this.hasTestedConnection = true;
    try {
      const connected = await testFirestoreConnection();
      this.isAvailable = connected;
      return connected;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  static checkConnection(): boolean {
    return Boolean(db);
  }

  // --- Valuations ---
  static async saveValuation(valuation: PhoneValuationRequest): Promise<void> {
    if (!db) return;
    try {
      const ref = doc(db, 'valuations', valuation.id);
      await setDoc(ref, {
        ...valuation,
        syncedAt: new Date().toISOString(),
        cloudTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (error: any) {
      if (error?.code !== 'unavailable') {
        console.warn('Firestore: Error saving valuation to cloud', error);
      }
    }
  }

  static subscribeValuations(onUpdate: (valuations: PhoneValuationRequest[]) => void): Unsubscribe | null {
    if (!db) return null;
    try {
      const colRef = collection(db, 'valuations');
      return onSnapshot(colRef, (snapshot) => {
        const items: PhoneValuationRequest[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as PhoneValuationRequest);
        });
        if (items.length > 0) {
          onUpdate(items);
        }
      }, (err) => {
        // Silently handle transient offline / unavailable states without throwing unhandled exceptions
        if (err?.code !== 'unavailable') {
          console.warn('Firestore: Valuations listener error', err);
        }
      });
    } catch (e) {
      return null;
    }
  }

  // --- Repair Bookings ---
  static async saveRepairBooking(booking: RepairBooking): Promise<void> {
    if (!db) return;
    try {
      const ref = doc(db, 'repairBookings', booking.id);
      await setDoc(ref, {
        ...booking,
        syncedAt: new Date().toISOString(),
        cloudTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (error: any) {
      if (error?.code !== 'unavailable') {
        console.warn('Firestore: Error saving repair booking to cloud', error);
      }
    }
  }

  static subscribeRepairs(onUpdate: (repairs: RepairBooking[]) => void): Unsubscribe | null {
    if (!db) return null;
    try {
      const colRef = collection(db, 'repairBookings');
      return onSnapshot(colRef, (snapshot) => {
        const items: RepairBooking[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as RepairBooking);
        });
        if (items.length > 0) {
          onUpdate(items);
        }
      }, (err) => {
        // Silently handle transient offline / unavailable states without throwing unhandled exceptions
        if (err?.code !== 'unavailable') {
          console.warn('Firestore: Repairs listener error', err);
        }
      });
    } catch (e) {
      return null;
    }
  }

  // --- Pre-Bookings ---
  static async savePreBooking(preBooking: PreBookingRequest): Promise<void> {
    if (!db) return;
    try {
      const ref = doc(db, 'preBookings', preBooking.id);
      await setDoc(ref, {
        ...preBooking,
        syncedAt: new Date().toISOString(),
        cloudTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (error: any) {
      if (error?.code !== 'unavailable') {
        console.warn('Firestore: Error saving pre-booking to cloud', error);
      }
    }
  }

  static subscribePreBookings(onUpdate: (preBookings: PreBookingRequest[]) => void): Unsubscribe | null {
    if (!db) return null;
    try {
      const colRef = collection(db, 'preBookings');
      return onSnapshot(colRef, (snapshot) => {
        const items: PreBookingRequest[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as PreBookingRequest);
        });
        if (items.length > 0) {
          onUpdate(items);
        }
      }, (err) => {
        // Silently handle transient offline / unavailable states without throwing unhandled exceptions
        if (err?.code !== 'unavailable') {
          console.warn('Firestore: PreBookings listener error', err);
        }
      });
    } catch (e) {
      return null;
    }
  }

  // --- Orders ---
  static async saveOrder(order: CustomerOrder): Promise<void> {
    if (!db) return;
    try {
      const ref = doc(db, 'orders', order.id);
      await setDoc(ref, {
        ...order,
        syncedAt: new Date().toISOString(),
        cloudTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore: Error saving order to cloud', error);
    }
  }

  // --- Products ---
  static async saveProduct(product: Product): Promise<void> {
    if (!db) return;
    try {
      const ref = doc(db, 'products', product.id);
      await setDoc(ref, {
        ...product,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore: Error saving product to cloud', error);
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      console.warn('Firestore: Error deleting product from cloud', error);
    }
  }

  // --- Rate List ---
  static async saveRateListItem(item: RateListItem): Promise<void> {
    if (!db) return;
    try {
      const ref = doc(db, 'rateList', item.id);
      await setDoc(ref, {
        ...item,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore: Error saving rate list item to cloud', error);
    }
  }

  static async deleteRateListItem(itemId: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'rateList', itemId));
    } catch (error) {
      console.warn('Firestore: Error deleting rate list item from cloud', error);
    }
  }

  // --- Upcoming Models ---
  static async saveUpcomingModel(model: UpcomingModel): Promise<void> {
    if (!db) return;
    try {
      const ref = doc(db, 'upcomingModels', model.id);
      await setDoc(ref, {
        ...model,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore: Error saving upcoming model to cloud', error);
    }
  }

  // --- Store Settings ---
  static async saveStoreSettings(settings: StoreSettings): Promise<void> {
    if (!db) return;
    try {
      const ref = doc(db, 'settings', 'store');
      await setDoc(ref, {
        ...settings,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore: Error saving store settings to cloud', error);
    }
  }

  // --- Full Cloud Sync (Push all local data to Firestore) ---
  static async pushAllToCloud(): Promise<{ success: boolean; count: number; message: string }> {
    if (!db) {
      return {
        success: true,
        count: 0,
        message: 'Local browser storage active. Cloud sync is currently decoupled.'
      };
    }
    try {
      let count = 0;

      // 1. Products
      const products = DataStorageService.getProducts();
      for (const p of products) {
        await this.saveProduct(p);
        count++;
      }

      // 2. Rate List
      const rateList = DataStorageService.getRateList();
      for (const item of rateList) {
        await this.saveRateListItem(item);
        count++;
      }

      // 3. Valuations
      const valuations = DataStorageService.getValuations();
      for (const val of valuations) {
        await this.saveValuation(val);
        count++;
      }

      // 4. Repairs
      const repairs = DataStorageService.getRepairBookings();
      for (const rep of repairs) {
        await this.saveRepairBooking(rep);
        count++;
      }

      // 5. Pre-bookings
      const preBookings = DataStorageService.getPreBookings();
      for (const pb of preBookings) {
        await this.savePreBooking(pb);
        count++;
      }

      // 6. Upcoming Models
      const upcoming = DataStorageService.getUpcomingModels();
      for (const u of upcoming) {
        await this.saveUpcomingModel(u);
        count++;
      }

      // 7. Store Settings
      const settings = DataStorageService.getStoreSettings();
      await this.saveStoreSettings(settings);
      count++;

      return {
        success: true,
        count,
        message: `Successfully synchronized ${count} items to Firebase Cloud Firestore!`
      };
    } catch (err: any) {
      console.error('Firestore pushAllToCloud error:', err);
      return {
        success: false,
        count: 0,
        message: `Sync failed: ${err.message || String(err)}`
      };
    }
  }

  // --- Full Cloud Fetch (Pull data from Firestore) ---
  static async pullAllFromCloud(): Promise<{ success: boolean; message: string }> {
    if (!db) {
      return {
        success: false,
        message: 'Cloud database is currently decoupled. Local browser storage is active.'
      };
    }
    try {
      // 1. Products
      const prodDocs = await getDocs(collection(db, 'products'));
      if (!prodDocs.empty) {
        const cloudProducts: Product[] = [];
        prodDocs.forEach((d) => cloudProducts.push(d.data() as Product));
        if (cloudProducts.length > 0) {
          DataStorageService.saveProducts(cloudProducts);
        }
      }

      // 2. Valuations
      const valDocs = await getDocs(collection(db, 'valuations'));
      if (!valDocs.empty) {
        const cloudValuations: PhoneValuationRequest[] = [];
        valDocs.forEach((d) => cloudValuations.push(d.data() as PhoneValuationRequest));
        if (cloudValuations.length > 0) {
          DataStorageService.saveValuations(cloudValuations);
        }
      }

      // 3. Repairs
      const repDocs = await getDocs(collection(db, 'repairBookings'));
      if (!repDocs.empty) {
        const cloudRepairs: RepairBooking[] = [];
        repDocs.forEach((d) => cloudRepairs.push(d.data() as RepairBooking));
        if (cloudRepairs.length > 0) {
          DataStorageService.saveRepairBookings(cloudRepairs);
        }
      }

      // 4. Pre-bookings
      const pbDocs = await getDocs(collection(db, 'preBookings'));
      if (!pbDocs.empty) {
        const cloudPreBookings: PreBookingRequest[] = [];
        pbDocs.forEach((d) => cloudPreBookings.push(d.data() as PreBookingRequest));
        if (cloudPreBookings.length > 0) {
          DataStorageService.savePreBookings(cloudPreBookings);
        }
      }

      // 5. Store Settings
      const setDocSnap = await getDoc(doc(db, 'settings', 'store'));
      if (setDocSnap.exists()) {
        DataStorageService.saveStoreSettings(setDocSnap.data() as StoreSettings);
      }

      return {
        success: true,
        message: 'Successfully pulled and merged latest data from Firebase Cloud.'
      };
    } catch (err: any) {
      console.error('Firestore pullAllFromCloud error:', err);
      return {
        success: false,
        message: `Pull failed: ${err.message || String(err)}`
      };
    }
  }
}
