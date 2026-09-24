import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import {
  auth,
  googleProvider,
  getCachedAccessToken,
  setCachedAccessToken
} from '../lib/firebase.ts';
import { FullAppBackupData } from '../types.ts';

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  webViewLink?: string;
  createdTime?: string;
  message: string;
}

export class GoogleDriveService {
  /**
   * Ensure user is signed in with Google and token is cached
   */
  static async getValidToken(forceInteractive = false): Promise<string> {
    const cached = getCachedAccessToken();
    if (cached && !forceInteractive) {
      return cached;
    }

    if (!auth) {
      throw new Error('Firebase Authentication is not configured or available.');
    }

    // Ensure Drive scope is explicitly requested
    googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error('Google sign-in succeeded, but failed to retrieve Drive access token.');
      }

      setCachedAccessToken(token);
      return token;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-in was cancelled before completion.');
      }
      throw new Error(err?.message || 'Failed to authenticate with Google Drive.');
    }
  }

  /**
   * Check if user is currently authenticated with Google
   */
  static isConnected(): boolean {
    return Boolean(auth?.currentUser && getCachedAccessToken());
  }

  /**
   * Get currently signed in Google account email / name
   */
  static getCurrentAccount(): { email: string | null; displayName: string | null; photoURL: string | null } | null {
    if (!auth?.currentUser) return null;
    return {
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      photoURL: auth.currentUser.photoURL
    };
  }

  /**
   * Disconnect / Sign out from Google
   */
  static async disconnectGoogle(): Promise<void> {
    setCachedAccessToken(null);
    if (auth) {
      await signOut(auth).catch(() => {});
    }
  }

  /**
   * Uploads complete website database backup JSON file directly to user's Google Drive
   */
  static async uploadWebsiteBackup(
    backupData: FullAppBackupData,
    customNote = ''
  ): Promise<DriveUploadResult> {
    const token = await this.getValidToken();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `pandey_mobile_store_backup_${timestamp}.json`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: `Pandey Mobile Store Full Website Backup • Traffic Chowk, Butwal • Version ${backupData.version}${
        customNote ? ` • Note: ${customNote}` : ''
      }`
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(backupData, null, 2) +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime,size',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (response.status === 401) {
        // Token expired, clear cached and retry once
        setCachedAccessToken(null);
        const retryToken = await this.getValidToken(true);
        const retryResp = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime,size',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${retryToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartRequestBody
          }
        );
        if (!retryResp.ok) {
          throw new Error(`Google Drive API error: ${retryResp.status} ${retryResp.statusText}`);
        }
        const retryData = await retryResp.json();
        return {
          success: true,
          fileId: retryData.id,
          fileName: retryData.name,
          webViewLink: retryData.webViewLink,
          createdTime: retryData.createdTime,
          message: `Backup successfully uploaded to your Google Drive (${fileName})`
        };
      }
      throw new Error(`Google Drive upload failed (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      fileId: data.id,
      fileName: data.name,
      webViewLink: data.webViewLink,
      createdTime: data.createdTime,
      message: `Backup successfully saved to your Google Drive (${fileName})`
    };
  }

  /**
   * List all website backups previously saved to Google Drive
   */
  static async listBackups(): Promise<DriveBackupFile[]> {
    const token = await this.getValidToken();

    const query = encodeURIComponent("name contains 'pandey_mobile_store_backup' and trashed = false");
    const fields = encodeURIComponent('files(id, name, createdTime, modifiedTime, size, webViewLink)');

    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=createdTime%20desc&pageSize=30`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        setCachedAccessToken(null);
        const retryToken = await this.getValidToken(true);
        const retryResp = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${retryToken}`
          }
        });
        if (!retryResp.ok) {
          throw new Error('Failed to retrieve backups from Google Drive.');
        }
        const data = await retryResp.json();
        return data.files || [];
      }
      throw new Error(`Google Drive list failed (${response.status})`);
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Download and parse a backup file from Google Drive for restore
   */
  static async downloadBackup(fileId: string): Promise<FullAppBackupData> {
    const token = await this.getValidToken();

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download backup file from Google Drive (${response.status})`);
    }

    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      return parsed as FullAppBackupData;
    } catch {
      throw new Error('The downloaded file is not valid JSON backup format.');
    }
  }

  /**
   * Delete a backup file from Google Drive
   */
  static async deleteBackup(fileId: string): Promise<void> {
    const token = await this.getValidToken();

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete backup file (${response.status})`);
    }
  }
}
