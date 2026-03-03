'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Download,
  Upload,
  FileJson,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  FileWarning,
} from 'lucide-react';
import { exportService, type ValidationResult, type ImportResult } from '@/services/export-service';

type ImportStrategy = 'merge' | 'replace';

export function DataExport() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('last-export-date');
    }
    return null;
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('merge');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportService.exportAll();
      exportService.downloadAsJson(data);
      const now = new Date().toISOString();
      setLastExport(now);
      localStorage.setItem('last-export-date', now);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidation(null);
    setImportResult(null);

    // Validate the file
    const result = await exportService.validateImport(file);
    setValidation(result);
  };

  const handleImport = async () => {
    if (!selectedFile || !validation?.valid) return;

    setShowConfirmDialog(false);
    setImporting(true);

    try {
      const result = await exportService.importData(selectedFile, importStrategy);
      setImportResult(result);

      if (result.success) {
        // Clear selection after successful import
        setSelectedFile(null);
        setValidation(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setValidation(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download a backup of all your data as a JSON file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Full Backup</p>
              <p className="text-xs text-muted-foreground">
                Includes classes, subjects, students, marks, chapters, lesson plans, and question papers
              </p>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export All
                </>
              )}
            </Button>
          </div>
          {lastExport && (
            <p className="text-xs text-muted-foreground">
              Last export: {new Date(lastExport).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Restore data from a backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="import-file">Backup File</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleFileSelect}
                className="flex-1 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              {selectedFile && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 rounded-lg p-3 ${
                  validation.valid
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {validation.valid ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {validation.valid ? 'Valid backup file' : 'Invalid backup file'}
                </span>
                <span className="text-sm opacity-75">
                  (Version: {validation.version})
                </span>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="rounded bg-muted p-2 text-center">
                  <p className="font-medium">{validation.summary.classes}</p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </div>
                <div className="rounded bg-muted p-2 text-center">
                  <p className="font-medium">{validation.summary.students}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="rounded bg-muted p-2 text-center">
                  <p className="font-medium">{validation.summary.marks}</p>
                  <p className="text-xs text-muted-foreground">Marks</p>
                </div>
                <div className="rounded bg-muted p-2 text-center">
                  <p className="font-medium">{validation.summary.chapters}</p>
                  <p className="text-xs text-muted-foreground">Chapters</p>
                </div>
              </div>

              {/* Errors */}
              {validation.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-2 flex items-center gap-2 font-medium text-red-800">
                    <XCircle className="h-4 w-4" />
                    Errors
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                    {validation.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <p className="mb-2 flex items-center gap-2 font-medium text-yellow-800">
                    <FileWarning className="h-4 w-4" />
                    Warnings ({validation.warnings.length})
                  </p>
                  <ul className="max-h-32 list-inside list-disc space-y-1 overflow-y-auto text-sm text-yellow-700">
                    {validation.warnings.slice(0, 5).map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                    {validation.warnings.length > 5 && (
                      <li className="text-yellow-600">
                        ... and {validation.warnings.length - 5} more warnings
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import Options */}
          {validation?.valid && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="import-strategy">Import Strategy</Label>
                <Select
                  value={importStrategy}
                  onValueChange={(v) => setImportStrategy(v as ImportStrategy)}
                >
                  <SelectTrigger id="import-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merge">
                      <div className="flex flex-col">
                        <span>Merge</span>
                        <span className="text-xs text-muted-foreground">
                          Add new records, update existing
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="replace">
                      <div className="flex flex-col">
                        <span>Replace</span>
                        <span className="text-xs text-muted-foreground">
                          Delete all existing data first
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div
              className={`rounded-lg p-4 ${
                importResult.success
                  ? 'border border-green-200 bg-green-50'
                  : 'border border-red-200 bg-red-50'
              }`}
            >
              <p
                className={`mb-2 flex items-center gap-2 font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                {importResult.success ? 'Import successful!' : 'Import completed with errors'}
              </p>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="text-center">
                  <p className="font-medium">{importResult.imported.classes}</p>
                  <p className="text-xs opacity-75">Classes</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{importResult.imported.students}</p>
                  <p className="text-xs opacity-75">Students</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{importResult.imported.marks}</p>
                  <p className="text-xs opacity-75">Marks</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{importResult.imported.chapters}</p>
                  <p className="text-xs opacity-75">Chapters</p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm text-red-700">
                  {importResult.errors.slice(0, 3).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Import
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {importStrategy === 'replace' ? (
                  <p className="text-red-600">
                    <strong>Warning:</strong> This will delete all existing data before importing.
                    This action cannot be undone.
                  </p>
                ) : (
                  <p>
                    Existing records with matching IDs will be updated. New records will be added.
                  </p>
                )}
                <p>
                  Importing {validation?.summary.classes} classes, {validation?.summary.students}{' '}
                  students, and {validation?.summary.marks} marks.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              className={importStrategy === 'replace' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {importStrategy === 'replace' ? 'Replace All Data' : 'Import Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
