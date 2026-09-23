import { generateProductDescription, extractModelFromUrlOrFilename } from '../utils/productDescriptionGenerator.ts';

export interface AIDescriptionRequest {
  brand?: string;
  model?: string;
  storage?: string;
  condition?: string;
  color?: string;
  price?: number | string;
  photoBase64?: string;
  url?: string;
}

export interface AIDescriptionResult {
  success: boolean;
  source: 'gemini-ai' | 'local-specs';
  description: string;
  detectedBrand?: string;
  detectedModel?: string;
  suggestedStorage?: string;
  suggestedColor?: string;
  keyHighlights?: string[];
  message?: string;
}

/**
 * Generate high-accuracy, intelligent smartphone product descriptions using Gemini AI
 * with seamless fallback to our comprehensive offline specifications engine.
 */
export async function generateSmartProductDescription(
  params: AIDescriptionRequest
): Promise<AIDescriptionResult> {
  // 1. Attempt Server-side / Cloudflare Edge Gemini AI
  try {
    const res = await fetch('/api/gemini/generate-product-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.description) {
        return {
          success: true,
          source: 'gemini-ai',
          description: data.data.description,
          detectedBrand: data.data.detectedBrand || params.brand,
          detectedModel: data.data.detectedModel || params.model,
          suggestedStorage: data.data.suggestedStorage || params.storage,
          suggestedColor: data.data.suggestedColor || params.color,
          keyHighlights: data.data.keyHighlights || [],
          message: '✨ AI (Gemini) generated complete specifications and authentic description!',
        };
      }
    }
  } catch (apiErr) {
    console.warn('Gemini API call to /api/gemini/generate-product-description failed, falling back to local engine:', apiErr);
  }

  // 2. Fallback to Local Verified Specifications Engine
  const localResult = generateProductDescription({
    brand: params.brand,
    model: params.model,
    storage: params.storage,
    condition: params.condition,
    url: params.url,
  });

  return {
    success: true,
    source: 'local-specs',
    description: localResult.description || '',
    detectedBrand: localResult.detectedBrand || params.brand,
    detectedModel: localResult.detectedModel || params.model,
    suggestedStorage: localResult.detectedStorage || params.storage,
    message: '📋 Verified hardware specifications and store guarantee generated.',
  };
}
