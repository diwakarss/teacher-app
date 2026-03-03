'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  LogIn,
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Settings,
  User,
} from 'lucide-react';
import { driveService, type DriveFile, type DriveAuthState } from '@/services/drive-service';
import { exportService } from '@/services/export-service';

export function CloudSync() {
  const [authState, setAuthState] = useState<DriveAuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [clientId, setClientId] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const [backups, setBackups] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const [selectedBackup, setSelectedBackup] = useState<DriveFile | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [restoreStrategy, setRestoreStrategy] = useState<'merge' | 'replace'>('merge');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize state
  useEffect(() => {
    const configured = driveService.isConfigured();
    setIsConfigured(configured);
    setClientId(driveService.getClientId());
    setAuthState(driveService.getAuthState());
    setLastBackup(driveService.getLastBackupTime());
  }, []);

  // Load backups when authenticated
  const loadBackups = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    setLoading(true);
    try {
      const files = await driveService.listBackups();
      setBackups(files);
    } catch (error) {
      console.error('Failed to load backups:', error);
      setMessage({ type: 'error', text: 'Failed to load backups' });
    } finally {
      setLoading(false);
    }
  }, [authState.isAuthenticated]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadBackups();
    }
  }, [authState.isAuthenticated, loadBackups]);

  const handleSaveClientId = () => {
    if (clientId.trim()) {
      driveService.setClientId(clientId.trim());
      setIsConfigured(true);
      setShowConfig(false);
      setMessage({ type: 'success', text: 'Client ID saved successfully' });
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const success = await driveService.authenticate();
      if (success) {
        setAuthState(driveService.getAuthState());
        setMessage({ type: 'success', text: 'Connected to Google Drive' });
      } else {
        setMessage({ type: 'error', text: 'Authentication failed' });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    driveService.logout();
    setAuthState({ isAuthenticated: false, user: null, accessToken: null });
    setBackups([]);
    setMessage({ type: 'success', text: 'Disconnected from Google Drive' });
  };

  const handleBackup = async () => {
    setUploading(true);
    setMessage(null);
    try {
      await driveService.uploadBackup();
      setLastBackup(driveService.getLastBackupTime());
      await loadBackups();
      setMessage({ type: 'success', text: 'Backup uploaded successfully' });
    } catch (error) {
      console.error('Backup failed:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Backup failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    setShowRestoreDialog(false);
    setDownloading(selectedBackup.id);
    setMessage(null);

    try {
      const data = await driveService.downloadBackup(selectedBackup.id);

      // Create a File object from the data
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const file = new File([blob], selectedBackup.name, { type: 'application/json' });

      // Import using export service
      const result = await exportService.importData(file, restoreStrategy);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Restored ${result.imported.classes} classes, ${result.imported.students} students, ${result.imported.marks} marks`,
        });
      } else {
        setMessage({ type: 'error', text: `Restore completed with ${result.errors.length} errors` });
      }
    } catch (error) {
      console.error('Restore failed:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Restore failed' });
    } finally {
      setDownloading(null);
      setSelectedBackup(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;

    setShowDeleteDialog(false);
    setLoading(true);
    setMessage(null);

    try {
      await driveService.deleteBackup(selectedBackup.id);
      await loadBackups();
      setMessage({ type: 'success', text: 'Backup deleted' });
    } catch (error) {
      console.error('Delete failed:', error);
      setMessage({ type: 'error', text: 'Failed to delete backup' });
    } finally {
      setLoading(false);
      setSelectedBackup(null);
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes, 10);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Not configured - show setup
  if (!isConfigured || showConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Google Drive
          </CardTitle>
          <CardDescription>
            Set up Google Drive integration for cloud backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">Setup Instructions</h4>
            <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>
                Go to the{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Cloud Console
                </a>
              </li>
              <li>Create a new OAuth 2.0 Client ID (Web application)</li>
              <li>Add your app URL to Authorized JavaScript origins</li>
              <li>Copy the Client ID and paste it below</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-id">OAuth Client ID</Label>
            <Input
              id="client-id"
              placeholder="123456789-abcdefg.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveClientId} disabled={!clientId.trim()}>
              Save Configuration
            </Button>
            {isConfigured && (
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Drive
          </CardTitle>
          <CardDescription>
            {authState.isAuthenticated
              ? 'Connected to Google Drive'
              : 'Connect to backup your data to the cloud'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authState.isAuthenticated && authState.user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {authState.user.picture ? (
                  <img
                    src={authState.user.picture}
                    alt={authState.user.name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{authState.user.name}</p>
                  <p className="text-sm text-muted-foreground">{authState.user.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Config
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sign in with your Google account to enable cloud backup
              </p>
              <Button onClick={handleLogin} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Connect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Actions */}
      {authState.isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5" />
              Backup
            </CardTitle>
            <CardDescription>
              Upload your current data to Google Drive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Create Backup</p>
                {lastBackup && (
                  <p className="text-xs text-muted-foreground">
                    Last backup: {formatDate(lastBackup)}
                  </p>
                )}
              </div>
              <Button onClick={handleBackup} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudUpload className="mr-2 h-4 w-4" />
                    Backup Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup List */}
      {authState.isAuthenticated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CloudDownload className="h-5 w-5" />
                  Restore
                </CardTitle>
                <CardDescription>
                  Download and restore from a previous backup
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadBackups} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : backups.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Cloud className="mx-auto mb-4 h-12 w-12" />
                <p>No backups found</p>
                <p className="text-sm">Create your first backup above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(backup.createdTime)} • {formatFileSize(backup.size)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowRestoreDialog(true);
                        }}
                        disabled={downloading === backup.id}
                      >
                        {downloading === backup.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CloudDownload className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from Backup</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Choose how to handle existing data:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="merge"
                      checked={restoreStrategy === 'merge'}
                      onChange={() => setRestoreStrategy('merge')}
                    />
                    <span>Merge - Add new records, update existing</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="replace"
                      checked={restoreStrategy === 'replace'}
                      onChange={() => setRestoreStrategy('replace')}
                    />
                    <span className="text-red-600">Replace - Delete all existing data first</span>
                  </label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className={restoreStrategy === 'replace' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
