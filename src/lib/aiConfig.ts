// Konfigurasi untuk layanan AI
interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxRetries: number;
  timeout: number; // dalam milidetik
}

// Konfigurasi default
const defaultConfig: AIConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY || undefined,
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  model: 'gemini-2.5-pro',
  maxRetries: 3,
  timeout: 30000, // 30 detik
};

// Fungsi untuk mendapatkan konfigurasi
export const getAIConfig = (): AIConfig => {
  if (!defaultConfig.apiKey) {
    console.error('VITE_GOOGLE_AI_API_KEY environment variable is not set. Please add it to your .env file.');
  }

  return {
    ...defaultConfig,
    apiKey: defaultConfig.apiKey,
  };
};

// Fungsi untuk mendapatkan URL API berdasarkan model
export const getAIUrl = (model: string = defaultConfig.model): string => {
  return `${defaultConfig.baseUrl}/${model}:generateContent?key=${defaultConfig.apiKey}`;
};