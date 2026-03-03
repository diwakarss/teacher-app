'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Database, Cloud } from 'lucide-react';
import { DocumentFormatter } from '@/components/settings/document-formatter';
import { DataExport } from '@/components/settings/data-export';
import { CloudSync } from '@/components/settings/cloud-sync';
import { PageLoadingSkeleton } from '@/components/ui/loading-skeleton';

function SettingsContent() {
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">
          Manage document formatting, data backup, and cloud sync
        </p>
      </div>

      <Tabs defaultValue="formatter" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="formatter" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Document Formatter</span>
            <span className="sm:hidden">Format</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data Management</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
          <TabsTrigger value="cloud" className="gap-2">
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Cloud Sync</span>
            <span className="sm:hidden">Cloud</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formatter">
          <DocumentFormatter />
        </TabsContent>

        <TabsContent value="data">
          <DataExport />
        </TabsContent>

        <TabsContent value="cloud">
          <CloudSync />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton message="Loading settings..." />}>
      <SettingsContent />
    </Suspense>
  );
}
