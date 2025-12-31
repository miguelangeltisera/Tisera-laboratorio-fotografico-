
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types.ts";

const API_KEY = process.env.API_KEY;

export async function enhanceImage(
  base64Data: string,
  mimeType: string,
  userPrompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const cleanedBase64 = base64Data.split(',')[1] || base64Data;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanedBase64,
            mimeType: mimeType,
          },
        },
        {
          text: `Acting as a master photo restoration and digital artist expert. Task: ${userPrompt}. 
          If restoration is requested: Remove scratches, tears, grain, and physical damage. Fill in missing parts realistically.
          If resizing is requested: Re-compose the image to the new aspect ratio intelligently, extending the background or focusing on the main subject as needed.
          Preserve the original character and essential features while maximizing definition and dynamic range.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("No output generated from Gemini.");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Gemini returned text but no image part. Try a different prompt.");
}
