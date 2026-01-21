
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Language } from "../types.ts";

// Always use process.env.API_KEY directly for initializing the SDK as per guidelines

export const getGeminiResponse = async (
  prompt: string,
  lang: Language,
  file?: { data: string; mimeType: string }
): Promise<{ text: string; groundingSources?: { title: string; uri: string }[] }> => {
  // Initialize GoogleGenAI directly with process.env.API_KEY right before usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are Sofia, a world-class professional virtual assistant specializing in Polish accounting and business law.
    Your personality: Helpful, precise, professional, and friendly.
    
    CRITICAL RULES:
    1. Language: Answer exclusively in ${lang === Language.PL ? 'Polish' : 'Russian'}. 
       If a document is in Polish but the target language is Russian, summarize it in Russian.
    2. Legal Basis: For all legal, tax, or accounting queries, ALWAYS cite the specific Polish Act (Ustawa), 
       article (Art.), and if possible, provide a logical reference or link to the ISAP (Internetowy System Aktów Prawnych).
    3. Accuracy: If a specific legal basis is unclear, clearly state that the information is general and request 
       more details or suggest a professional consultation.
    4. Document Summarization: When analyzing files, provide:
       - Document type (What is it?)
       - Brief meaning (What does it mean?)
       - Action items (What needs to be done? Steps/Deadlines)
       - Legal basis (Relevant law/article).
    5. Formatting: Use Markdown for readability.
  `;

  const contents: any = [];
  
  if (file) {
    contents.push({
      inlineData: {
        data: file.data.split(',')[1],
        mimeType: file.mimeType
      }
    });
  }
  
  contents.push({ text: prompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: contents },
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    // Extract grounding sources as required when using googleSearch tool
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }))
      .filter((source: any) => source.uri);

    return {
      text: response.text || "No response received.",
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Error occurred while processing your request." };
  }
};

export const generateSpeech = async (text: string): Promise<Uint8Array | null> => {
  try {
    // Initialize GoogleGenAI directly with process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decoding logic following the provided guidelines for raw PCM data
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
