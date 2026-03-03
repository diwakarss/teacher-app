'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  FileText,
  Download,
  Settings2,
  Loader2,
  Trash2,
  Plus,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  parseDocx,
  applyFormatting,
  downloadDocument,
  getPresets,
  savePreset,
  deletePreset,
  getDefaultRules,
  type ParsedDocument,
  type FormattingPreset,
  type FormattingRules,
} from '@/lib/doc-formatter';
import { v4 as uuid } from 'uuid';

const FONTS = [
  'Arial',
  'Times New Roman',
  'Calibri',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Helvetica',
];

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 24];
const LINE_SPACINGS = [1.0, 1.15, 1.5, 2.0];
const ALIGNMENTS = ['left', 'center', 'right', 'justify'] as const;

export function DocumentFormatter() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedDocument | null>(null);
  const [parsing, setParsing] = useState(false);
  const [formatting, setFormatting] = useState(false);

  const [presets, setPresets] = useState<FormattingPreset[]>(() => getPresets());
  const [selectedPresetId, setSelectedPresetId] = useState<string>('default-worksheet');
  const [customRules, setCustomRules] = useState<FormattingRules>(getDefaultRules());

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.docx')) {
      toast.error('Please select a .docx file');
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    try {
      const result = await parseDocx(selectedFile);
      setParsed(result);

      if (result.messages.length > 0) {
        toast.info(`Parsed with ${result.messages.length} warning(s)`);
      } else {
        toast.success('Document parsed successfully');
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Failed to parse document');
      setParsed(null);
    } finally {
      setParsing(false);
    }
  }, []);

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setCustomRules({ ...preset.rules });
    }
  };

  const handleRuleChange = <K extends keyof FormattingRules>(
    key: K,
    value: FormattingRules[K]
  ) => {
    setCustomRules((prev) => ({ ...prev, [key]: value }));
  };

  const handleMarginChange = (side: keyof FormattingRules['margins'], value: number) => {
    setCustomRules((prev) => ({
      ...prev,
      margins: { ...prev.margins, [side]: value },
    }));
  };

  const handleFormat = async () => {
    if (!parsed) return;

    setFormatting(true);
    try {
      const blob = await applyFormatting(parsed, customRules);
      const filename = file?.name.replace('.docx', '_formatted.docx') || 'formatted.docx';
      downloadDocument(blob, filename);
      toast.success('Document formatted and downloaded');
    } catch (error) {
      console.error('Format error:', error);
      toast.error('Failed to format document');
    } finally {
      setFormatting(false);
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const now = new Date().toISOString();
    const preset: FormattingPreset = {
      id: uuid(),
      name: newPresetName.trim(),
      rules: { ...customRules },
      createdAt: now,
      updatedAt: now,
    };

    savePreset(preset);
    setPresets(getPresets());
    setSelectedPresetId(preset.id);
    setSaveDialogOpen(false);
    setNewPresetName('');
    toast.success('Preset saved');
  };

  const handleDeletePreset = (id: string) => {
    if (id.startsWith('default-')) {
      toast.error('Cannot delete default presets');
      return;
    }

    deletePreset(id);
    setPresets(getPresets());
    if (selectedPresetId === id) {
      setSelectedPresetId('default-worksheet');
      const defaultPreset = presets.find((p) => p.id === 'default-worksheet');
      if (defaultPreset) {
        setCustomRules({ ...defaultPreset.rules });
      }
    }
    toast.success('Preset deleted');
  };

  const handleClear = () => {
    setFile(null);
    setParsed(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!parsed ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                Upload a Word document (.docx) to format
              </p>
              <label>
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={parsing}
                />
                <Button asChild disabled={parsing}>
                  <span>
                    {parsing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select File
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{file?.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
              <div className="rounded-md border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  {parsed.elements.length} elements found
                  {parsed.messages.length > 0 && ` • ${parsed.messages.length} warning(s)`}
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-md border p-4 text-sm">
                <div dangerouslySetInnerHTML={{ __html: parsed.html }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formatting Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Formatting Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Selection */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Preset</Label>
              <Select value={selectedPresetId} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={() => setSaveDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
            {selectedPreset && !selectedPreset.id.startsWith('default-') && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDeletePreset(selectedPreset.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Font Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <Select
                value={customRules.headingFont}
                onValueChange={(v) => handleRuleChange('headingFont', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Heading Size</Label>
              <Select
                value={customRules.headingSize.toString()}
                onValueChange={(v) => handleRuleChange('headingSize', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}pt
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body Font</Label>
              <Select
                value={customRules.bodyFont}
                onValueChange={(v) => handleRuleChange('bodyFont', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body Size</Label>
              <Select
                value={customRules.bodySize.toString()}
                onValueChange={(v) => handleRuleChange('bodySize', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}pt
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line Spacing and Alignment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Line Spacing</Label>
              <Select
                value={customRules.lineSpacing.toString()}
                onValueChange={(v) => handleRuleChange('lineSpacing', parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_SPACINGS.map((spacing) => (
                    <SelectItem key={spacing} value={spacing.toString()}>
                      {spacing}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={customRules.alignment}
                onValueChange={(v) =>
                  handleRuleChange('alignment', v as FormattingRules['alignment'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALIGNMENTS.map((align) => (
                    <SelectItem key={align} value={align}>
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-2">
            <Label>Margins (inches)</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="3"
                  value={customRules.margins.top}
                  onChange={(e) => handleMarginChange('top', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="3"
                  value={customRules.margins.bottom}
                  onChange={(e) => handleMarginChange('bottom', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="3"
                  value={customRules.margins.left}
                  onChange={(e) => handleMarginChange('left', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="3"
                  value={customRules.margins.right}
                  onChange={(e) => handleMarginChange('right', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Format Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleFormat}
            disabled={!parsed || formatting}
          >
            {formatting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Formatting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Format & Download
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogDescription>
              Save current formatting options as a preset for quick access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="My Custom Preset"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              <Save className="mr-2 h-4 w-4" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
