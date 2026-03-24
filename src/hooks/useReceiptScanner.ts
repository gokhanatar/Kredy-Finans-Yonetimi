import { useState, useCallback } from 'react';
import { parseReceipt, type ParsedReceipt } from '@/lib/receiptParser';
import { isGeminiConfigured, scanReceiptWithGemini } from '@/lib/geminiReceiptScanner';

export function useReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanReceipt = useCallback(async (): Promise<ParsedReceipt | null> => {
    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      // Lazy import camera and OCR plugins
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

      const photo = await Camera.getPhoto({
        quality: 95,
        source: CameraSource.Prompt,
        resultType: CameraResultType.Uri,
        saveToGallery: false,
      });

      if (!photo.path) {
        throw new Error('NO_PHOTO');
      }

      // OCR
      const { ImageToText } = await import('@capacitor-community/image-to-text');
      const ocrResult = await ImageToText.detectText({ filename: photo.path });
      const rawText = ocrResult.textDetections?.map((d: any) => d.text).join('\n') || '';

      if (!rawText.trim()) {
        throw new Error('NO_TEXT');
      }

      const parsed = parseReceipt(rawText);
      setResult(parsed);
      return parsed;
    } catch (err: any) {
      // User cancelled camera
      if (err?.message === 'User cancelled photos app' || err?.message?.includes('cancel')) {
        setIsScanning(false);
        return null;
      }

      if (err?.message === 'NO_PHOTO') {
        setError('cameraError');
      } else if (err?.message === 'NO_TEXT') {
        setError('ocrError');
      } else if (err?.message?.includes('not implemented') || err?.code === 'UNIMPLEMENTED') {
        setError('notSupported');
      } else {
        console.error('Receipt scan error:', err);
        setError('cameraError');
      }
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const scanReceiptWithAI = useCallback(async (): Promise<ParsedReceipt | null> => {
    if (!isGeminiConfigured()) {
      setError('noApiKey');
      return null;
    }

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      // Get photo as base64 for Gemini
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

      const photo = await Camera.getPhoto({
        quality: 95,
        source: CameraSource.Prompt,
        resultType: CameraResultType.Base64,
        saveToGallery: false,
      });

      if (!photo.base64String) {
        throw new Error('NO_PHOTO');
      }

      try {
        // Try Gemini AI scan
        const parsed = await scanReceiptWithGemini(photo.base64String);
        setResult(parsed);
        return parsed;
      } catch (geminiErr) {
        // Fallback: try device OCR with the same image
        setError('geminiError');

        // Re-take photo for device OCR (different result type needed)
        try {
          const fallbackPhoto = await Camera.getPhoto({
            quality: 95,
            source: CameraSource.Prompt,
            resultType: CameraResultType.Uri,
            saveToGallery: false,
          });

          if (fallbackPhoto.path) {
            const { ImageToText } = await import('@capacitor-community/image-to-text');
            const ocrResult = await ImageToText.detectText({ filename: fallbackPhoto.path });
            const rawText = ocrResult.textDetections?.map((d: any) => d.text).join('\n') || '';
            if (rawText.trim()) {
              const parsed = parseReceipt(rawText);
              setResult(parsed);
              setError(null);
              return parsed;
            }
          }
        } catch {
          // Fallback also failed
        }

        return null;
      }
    } catch (err: any) {
      if (err?.message === 'User cancelled photos app' || err?.message?.includes('cancel')) {
        setIsScanning(false);
        return null;
      }

      if (err?.message === 'NO_PHOTO') {
        setError('cameraError');
      } else if (err?.message?.includes('not implemented') || err?.code === 'UNIMPLEMENTED') {
        setError('notSupported');
      } else {
        console.error('AI receipt scan error:', err);
        setError('cameraError');
      }
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { scanReceipt, scanReceiptWithAI, isScanning, result, error, clearResult };
}
