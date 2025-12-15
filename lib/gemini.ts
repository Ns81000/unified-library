import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Ollama configuration for embeddings
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'embeddinggemma:300m';

// Cache for embedding dimension (detected on first call)
let embeddingDimension: number | null = null;
// Track if we've logged connection info
let hasLoggedConnectionInfo = false;

// Helper to test Ollama connectivity (called once on first embedding request)
async function testOllamaConnection(): Promise<boolean> {
  if (hasLoggedConnectionInfo) return true;
  
  try {
    console.log(`[Ollama] Attempting to connect to: ${OLLAMA_URL}`);
    console.log(`[Ollama] Using model: ${OLLAMA_EMBEDDING_MODEL}`);
    
    // Simple health check - just try to reach the API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];
      console.log(`[Ollama] Connected successfully! Available models: ${models.join(', ')}`);
      hasLoggedConnectionInfo = true;
      return true;
    } else {
      console.warn(`[Ollama] API returned status ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error(`[Ollama] Connection test failed:`, error.message || error);
    if (error.cause) {
      console.error(`[Ollama] Cause:`, error.cause.message || error.cause);
    }
    return false;
  }
}

// Lazy initialization to avoid errors during build time
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not defined in environment variables');
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
  }
  
  return genAI;
}

// Safety settings to disable all content filtering
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// High-quality model for data enrichment (auto-fill)
export function getFlashModel() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
  });
}

// Fast model for search and recommendations
export function getFlashLiteModel() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    safetySettings,
  });
}

// Helper function to generate embeddings using Ollama (local, no external API)
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Test connection on first call
    await testOllamaConnection();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for embeddings
    
    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_EMBEDDING_MODEL,
        prompt: text,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    // Cache the dimension for fallback
    if (embeddingDimension === null) {
      embeddingDimension = data.embedding.length;
      console.log(`[Ollama] Embedding dimension detected: ${embeddingDimension}`);
    }

    return data.embedding;
  } catch (error: any) {
    console.error('[Ollama] Error generating embedding, using safe fallback:', error.message || error);
    if (error.cause) {
      console.error('[Ollama] Cause:', error.cause.message || error.cause);
    }
    // Use cached dimension or default to 768 (common for embedding models)
    const DIM = embeddingDimension || 768;
    return Array(DIM).fill(0);
  }
}
