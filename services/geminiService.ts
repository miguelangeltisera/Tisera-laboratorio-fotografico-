
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types.ts";

export async function enhanceImage(
  base64Data: string,
  mimeType: string,
  userPrompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("No se encontró la API_KEY. Por favor configura las variables de entorno en Netlify.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanedBase64 = base64Data.split(',')[1] || base64Data;

  try {
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
            text: `Actúa como una IA de nivel forense especializada en restauración y reconstrucción fotográfica. 
            OBJETIVO: ${userPrompt}.
            
            GUÍA TÉCNICA CRÍTICA:
            1. RECONSTRUCCIÓN CONTEXTUAL: Si hay huecos, bordes faltantes o áreas severamente dañadas, rellénalos sintetizando nuevo contenido que mantenga la continuidad perfecta de la textura, iluminación y geometría original.
            2. SANADO DE RASGUÑOS: Elimina quirúrgicamente cualquier elemento ajeno (pliegues, rayones, motas de polvo).
            3. FIDELIDAD ESTRUCTURAL: Si reconstruyes rostros o elementos arquitectónicos, utiliza simetría y perspectiva lógica.
            4. RESTAURACIÓN DE COLOR Y TONOS: Corrige el desvanecimiento químico (sepia, amarillo) y recupera la viveza natural.
            5. FORMATO: Adapta el lienzo a ${aspectRatio} expandiendo el fondo de forma imperceptible si es necesario.
            
            Produce una imagen final en alta resolución con acabado profesional.`,
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
      throw new Error("El sistema de IA no ha podido generar la imagen. Intenta con una descripción más detallada.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No se recibió una imagen válida de la IA.");
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    if (error.status === 403 || error.status === 401) {
      throw new Error("Error de Autenticación: Verifica tu API Key en Netlify.");
    }
    throw error;
  }
}
