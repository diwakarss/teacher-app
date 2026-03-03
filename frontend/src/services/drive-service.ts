/**
 * Google Drive Service
 *
 * OAuth2 authentication and backup/restore to Google Drive.
 * Uses Google Identity Services for auth and Drive API v3 for file operations.
 */

import { exportService, type ExportData } from './export-service';

const DRIVE_FOLDER_NAME = 'Teacher Assistant Backups';
const BACKUP_MIME_TYPE = 'application/json';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
}

export interface DriveAuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    picture?: string;
  } | null;
  accessToken: string | null;
}

// Storage keys
const AUTH_STATE_KEY = 'drive-auth-state';
const TOKEN_KEY = 'drive-access-token';
const TOKEN_EXPIRY_KEY = 'drive-token-expiry';

// Client ID should be configured in environment or settings
// For now, we'll use a placeholder that users can configure
let CLIENT_ID = '';

export const driveService = {
  /**
   * Set the OAuth client ID (must be called before authentication)
   */
  setClientId(clientId: string): void {
    CLIENT_ID = clientId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('drive-client-id', clientId);
    }
  },

  /**
   * Get the configured client ID
   */
  getClientId(): string {
    if (!CLIENT_ID && typeof window !== 'undefined') {
      CLIENT_ID = localStorage.getItem('drive-client-id') || '';
    }
    return CLIENT_ID;
  },

  /**
   * Check if a client ID is configured
   */
  isConfigured(): boolean {
    return !!this.getClientId();
  },

  /**
   * Get current authentication state
   */
  getAuthState(): DriveAuthState {
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null, accessToken: null };
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const userJson = localStorage.getItem(AUTH_STATE_KEY);

    // Check if token is expired
    if (expiry && new Date(expiry) < new Date()) {
      this.logout();
      return { isAuthenticated: false, user: null, accessToken: null };
    }

    if (!token) {
      return { isAuthenticated: false, user: null, accessToken: null };
    }

    let user = null;
    try {
      user = userJson ? JSON.parse(userJson) : null;
    } catch {
      user = null;
    }

    return {
      isAuthenticated: true,
      user,
      accessToken: token,
    };
  },

  /**
   * Authenticate with Google OAuth
   * Returns true if authentication was successful
   */
  async authenticate(): Promise<boolean> {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('Google Drive client ID not configured. Please add your OAuth client ID in settings.');
    }

    return new Promise((resolve) => {
      // Load Google Identity Services library if not loaded
      if (!window.google?.accounts) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => this.initAuth(clientId, resolve);
        document.head.appendChild(script);
      } else {
        this.initAuth(clientId, resolve);
      }
    });
  },

  /**
   * Initialize OAuth flow
   */
  initAuth(clientId: string, resolve: (success: boolean) => void): void {
    if (!window.google?.accounts?.oauth2) {
      console.error('Google Identity Services not loaded');
      resolve(false);
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (response: { access_token?: string; expires_in?: number; error?: string }) => {
        if (response.error) {
          console.error('OAuth error:', response.error);
          resolve(false);
          return;
        }

        if (response.access_token) {
          // Store token
          localStorage.setItem(TOKEN_KEY, response.access_token);

          // Calculate and store expiry
          const expiresIn = response.expires_in || 3600;
          const expiry = new Date(Date.now() + expiresIn * 1000);
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());

          // Fetch user info
          try {
            const userInfo = await this.fetchUserInfo(response.access_token);
            localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(userInfo));
          } catch (e) {
            console.error('Failed to fetch user info:', e);
          }

          resolve(true);
        } else {
          resolve(false);
        }
      },
    });

    tokenClient.requestAccessToken();
  },

  /**
   * Fetch user info from Google
   */
  async fetchUserInfo(token: string): Promise<{ name: string; email: string; picture?: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return {
      name: data.name || data.email,
      email: data.email,
      picture: data.picture,
    };
  },

  /**
   * Logout from Google Drive
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(AUTH_STATE_KEY);
  },

  /**
   * Get or create the backup folder in Drive
   */
  async getOrCreateBackupFolder(): Promise<string> {
    const auth = this.getAuthState();
    if (!auth.isAuthenticated || !auth.accessToken) {
      throw new Error('Not authenticated');
    }

    // Search for existing folder
    const searchResponse = await fetch(
      `${DRIVE_API_BASE}/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive`,
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Failed to search for backup folder');
    }

    const searchResult = await searchResponse.json();

    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    // Create folder if it doesn't exist
    const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create backup folder');
    }

    const folder = await createResponse.json();
    return folder.id;
  },

  /**
   * Upload a backup to Google Drive
   */
  async uploadBackup(): Promise<DriveFile> {
    const auth = this.getAuthState();
    if (!auth.isAuthenticated || !auth.accessToken) {
      throw new Error('Not authenticated');
    }

    // Get backup data
    const data = await exportService.exportAll();
    const folderId = await this.getOrCreateBackupFolder();

    // Create filename with timestamp
    const filename = `backup-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.json`;

    // Upload file using multipart upload
    const metadata = {
      name: filename,
      parents: [folderId],
      mimeType: BACKUP_MIME_TYPE,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelimiter = '\r\n--' + boundary + '--';

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + BACKUP_MIME_TYPE + '\r\n\r\n' +
      JSON.stringify(data, null, 2) +
      closeDelimiter;

    const uploadResponse = await fetch(
      `${UPLOAD_API_BASE}/files?uploadType=multipart`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'multipart/related; boundary=' + boundary,
        },
        body: multipartBody,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Failed to upload backup: ${error}`);
    }

    const file = await uploadResponse.json();

    // Update last backup timestamp
    localStorage.setItem('drive-last-backup', new Date().toISOString());

    return {
      id: file.id,
      name: file.name,
      createdTime: file.createdTime || new Date().toISOString(),
      modifiedTime: file.modifiedTime || new Date().toISOString(),
      size: String(multipartBody.length),
    };
  },

  /**
   * List backups in Google Drive
   */
  async listBackups(): Promise<DriveFile[]> {
    const auth = this.getAuthState();
    if (!auth.isAuthenticated || !auth.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const folderId = await this.getOrCreateBackupFolder();

      const response = await fetch(
        `${DRIVE_API_BASE}/files?q='${folderId}' in parents and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime,modifiedTime,size)`,
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to list backups');
      }

      const result = await response.json();
      return (result.files || []).map((f: DriveFile) => ({
        id: f.id,
        name: f.name,
        createdTime: f.createdTime,
        modifiedTime: f.modifiedTime,
        size: f.size || '0',
      }));
    } catch (e) {
      console.error('Failed to list backups:', e);
      return [];
    }
  },

  /**
   * Download a backup from Google Drive
   */
  async downloadBackup(fileId: string): Promise<ExportData> {
    const auth = this.getAuthState();
    if (!auth.isAuthenticated || !auth.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download backup');
    }

    return response.json();
  },

  /**
   * Delete a backup from Google Drive
   */
  async deleteBackup(fileId: string): Promise<void> {
    const auth = this.getAuthState();
    if (!auth.isAuthenticated || !auth.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete backup');
    }
  },

  /**
   * Get last backup timestamp
   */
  getLastBackupTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('drive-last-backup');
  },
};

// Type augmentation for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}
