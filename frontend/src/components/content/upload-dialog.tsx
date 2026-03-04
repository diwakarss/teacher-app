'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, AlertCircle, Camera, ImageIcon, X } from 'lucide-react';
import { useContentStore } from '@/stores/content-store';
import {
  extractTextFromPDF,
  hasTextLayer,
  renderPdfPagesToImages,
  clearPdfCache,
  type PDFExtractionProgress,
} from '@/lib/pdf-extractor';
import { extractTextFromImages, type OCRProgress } from '@/lib/ocr-processor';
import { suggestChapterName } from '@/lib/chapter-detector';
import { toast } from 'sonner';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}

type UploadStep = 'select' | 'processing' | 'preview';
type SourceType = 'pdf' | 'image';

export function UploadDialog({ open, onOpenChange, subjectId }: UploadDialogProps) {
  const { createChapter, getNextChapterNumber } = useContentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<UploadStep>('select');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('pdf');

  const [extractedText, setExtractedText] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [chapterName, setChapterName] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [saving, setSaving] = useState(false);
  const [noTextLayerWarning, setNoTextLayerWarning] = useState(false);
  const [lowConfidenceWarning, setLowConfidenceWarning] = useState(false);

  // Image preview state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // PDF OCR fallback state
  const [pendingOcrFallback, setPendingOcrFallback] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const resetState = () => {
    setStep('select');
    setProgress(0);
    setProgressText('');
    setExtractedText('');
    setPageCount(1);
    setChapterName('');
    setChapterNumber(1);
    setSaving(false);
    setNoTextLayerWarning(false);
    setLowConfidenceWarning(false);
    setSelectedImages([]);
    setImagePreviews([]);
    setSourceType('pdf');
    setPendingOcrFallback(false);
    setPdfFile(null);
    clearPdfCache();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be under 50MB');
      return;
    }

    setPdfFile(file);
    setSourceType('pdf');
    setStep('processing');
    setProgressText('Extracting text from PDF...');

    try {
      const result = await extractTextFromPDF(file, (p: PDFExtractionProgress) => {
        setProgress(p.percentage);
        setProgressText(`Processing page ${p.currentPage} of ${p.totalPages}...`);
      });

      if (!hasTextLayer(result)) {
        // No text layer detected - offer OCR fallback
        setNoTextLayerWarning(true);
        setPendingOcrFallback(true);
        setPageCount(result.pageCount);
        setExtractedText('');

        const nextNumber = await getNextChapterNumber();
        const suggestion = suggestChapterName('', file.name, nextNumber);
        setChapterName(suggestion.name);
        setChapterNumber(suggestion.chapterNumber);

        setStep('preview');
        return;
      }

      setExtractedText(result.text);
      setPageCount(result.pageCount);

      const nextNumber = await getNextChapterNumber();
      const suggestion = suggestChapterName(result.text, file.name, nextNumber);
      setChapterName(suggestion.name);
      setChapterNumber(suggestion.chapterNumber);

      setStep('preview');
    } catch (error) {
      console.error('Failed to extract text from PDF:', error);
      toast.error('Failed to process PDF. Please try again.');
      resetState();
    }
  };

  const runOcrFallback = async () => {
    if (!pdfFile) return;

    setStep('processing');
    setProgressText('Rendering PDF pages for OCR...');
    setProgress(0);

    try {
      // Render PDF pages to images
      const images = await renderPdfPagesToImages(pdfFile, (p) => {
        setProgress(Math.round(p.percentage * 0.3)); // 0-30% for rendering
        setProgressText(`Rendering page ${p.currentPage} of ${p.totalPages}...`);
      });

      setProgressText('Running OCR on rendered pages...');

      // Run OCR on rendered images
      const result = await extractTextFromImages(
        images,
        (p: OCRProgress & { currentImage: number; totalImages: number }) => {
          const overallProgress = 30 + Math.round(
            ((p.currentImage - 1) / p.totalImages) * 70 +
              (p.progress / p.totalImages) * 0.7
          );
          setProgress(overallProgress);

          if (p.status === 'loading tesseract core') {
            setProgressText('Loading OCR engine...');
          } else if (p.status === 'initializing api') {
            setProgressText('Initializing...');
          } else if (p.status === 'loading language traineddata') {
            setProgressText('Loading language data...');
          } else if (p.status === 'recognizing text') {
            setProgressText(
              `OCR: page ${p.currentImage} of ${p.totalImages}...`
            );
          } else {
            setProgressText(`Processing page ${p.currentImage} of ${p.totalImages}...`);
          }
        }
      );

      if (result.confidence < 70) {
        setLowConfidenceWarning(true);
      }

      setExtractedText(result.text);
      setPendingOcrFallback(false);
      setNoTextLayerWarning(false);
      setSourceType('pdf'); // Keep as PDF source type

      // Update chapter name suggestion with actual text
      const nextNumber = await getNextChapterNumber();
      const suggestion = suggestChapterName(
        result.text,
        pdfFile.name,
        nextNumber
      );
      setChapterName(suggestion.name);
      setChapterNumber(suggestion.chapterNumber);

      setStep('preview');
    } catch (error) {
      console.error('OCR fallback failed:', error);
      toast.error('OCR processing failed. Please try uploading images directly.');
      setStep('preview'); // Go back to preview to let user retry or cancel
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast.error('Please select image files');
      return;
    }

    // Check total size (50MB limit for all images)
    const totalSize = imageFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      toast.error('Total file size must be under 50MB');
      return;
    }

    // Create previews
    const previews: string[] = [];
    imageFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      previews.push(url);
    });

    setSelectedImages(imageFiles);
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const processImages = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select images first');
      return;
    }

    setSourceType('image');
    setStep('processing');
    setProgressText('Initializing OCR engine...');
    setProgress(0);

    try {
      const result = await extractTextFromImages(
        selectedImages,
        (p: OCRProgress & { currentImage: number; totalImages: number }) => {
          const overallProgress = Math.round(
            ((p.currentImage - 1) / p.totalImages) * 100 +
              (p.progress / p.totalImages)
          );
          setProgress(overallProgress);

          if (p.status === 'loading tesseract core') {
            setProgressText('Loading OCR engine...');
          } else if (p.status === 'initializing api') {
            setProgressText('Initializing...');
          } else if (p.status === 'loading language traineddata') {
            setProgressText('Loading language data...');
          } else if (p.status === 'recognizing text') {
            setProgressText(
              `Recognizing text: image ${p.currentImage} of ${p.totalImages}...`
            );
          } else {
            setProgressText(`Processing image ${p.currentImage} of ${p.totalImages}...`);
          }
        }
      );

      if (result.confidence < 70) {
        setLowConfidenceWarning(true);
      }

      setExtractedText(result.text);
      setPageCount(selectedImages.length);

      const nextNumber = await getNextChapterNumber();
      const suggestion = suggestChapterName(
        result.text,
        selectedImages[0]?.name || 'image',
        nextNumber
      );
      setChapterName(suggestion.name);
      setChapterNumber(suggestion.chapterNumber);

      // Clean up previews
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviews([]);

      setStep('preview');
    } catch (error) {
      console.error('Failed to process images:', error);
      toast.error('Failed to process images. Please try again.');
      resetState();
    }
  };

  const handleSave = async () => {
    if (!chapterName.trim()) {
      toast.error('Please enter a chapter name');
      return;
    }

    if (!extractedText.trim()) {
      toast.error('No content to save');
      return;
    }

    setSaving(true);
    try {
      await createChapter({
        subjectId,
        name: chapterName.trim(),
        chapterNumber,
        content: extractedText,
        pageCount,
        sourceType,
        difficulty: null,
      });
      toast.success('Chapter saved successfully');
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to save chapter:', error);
      toast.error('Failed to save chapter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Content</DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf">PDF</TabsTrigger>
              <TabsTrigger value="image">Image/Camera</TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="mt-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Upload a PDF scanned with Microsoft Lens or similar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Max file size: 50MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfSelect}
                  />
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Select PDF
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-4">
              <div className="space-y-4">
                {selectedImages.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Take photos or upload images of textbook pages
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports JPG, PNG. Max total size: 50MB
                    </p>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <div className="mt-4 flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Select Images
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-[300px] overflow-y-auto pr-1">
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((url, idx) => (
                          <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={url}
                              alt={`Page ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                        <button
                          onClick={() => imageInputRef.current?.click()}
                          className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:text-gray-500"
                        >
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-xs mt-1">Add</span>
                        </button>
                      </div>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <Button onClick={processImages} className="w-full">
                      Process {selectedImages.length} {selectedImages.length === 1 ? 'Image' : 'Images'}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === 'processing' && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              {sourceType === 'pdf' ? (
                <FileText className="mx-auto h-12 w-12 text-primary animate-pulse" />
              ) : (
                <Camera className="mx-auto h-12 w-12 text-primary animate-pulse" />
              )}
              <p className="mt-4 text-sm text-gray-600">{progressText}</p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {step === 'preview' && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {noTextLayerWarning && pendingOcrFallback && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-800 flex-1">
                  <p className="font-medium">Image-based PDF detected</p>
                  <p className="text-yellow-700 mb-2">
                    This PDF does not have embedded text. Would you like to run OCR to extract text from the images?
                  </p>
                  <Button
                    size="sm"
                    onClick={runOcrFallback}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Run OCR Extraction
                  </Button>
                </div>
              </div>
            )}

            {noTextLayerWarning && !pendingOcrFallback && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-800">
                  <p className="font-medium">Low text content detected</p>
                  <p className="text-yellow-700">
                    This PDF may not have an embedded text layer. For better results, use
                    Microsoft Lens or similar scanner app that creates searchable PDFs.
                  </p>
                </div>
              </div>
            )}

            {lowConfidenceWarning && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-800">
                  <p className="font-medium">Low OCR confidence</p>
                  <p className="text-yellow-700">
                    The text recognition confidence is low. Review and edit the extracted
                    text before saving.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chapterName">Chapter Name</Label>
                <Input
                  id="chapterName"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="Enter chapter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapterNumber">Number</Label>
                <Input
                  id="chapterNumber"
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Extracted Text</Label>
                <span className="text-xs text-gray-500">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'} • {sourceType.toUpperCase()}
                </span>
              </div>
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="h-48 resize-none font-mono text-sm"
                placeholder="Extracted text will appear here..."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => resetState()}>
                Upload Different File
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Chapter'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
