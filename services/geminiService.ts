
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types.ts";

export async function enhanceImage(
  base64Data: string,
  mimeType: string,
  userPrompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey.length < 5) {
    throw new Error("ERROR_SISTEMA: No se detectó la clave de API. Verifica la configuración en Netlify.");
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
            text: `PROTOCOLO DE RECONSTRUCCIÓN FORENSE (Miguel Ángel Tisera Lab):
            
            OBJETIVO PRINCIPAL: ${userPrompt}.
            
            DIRECTRICES DE CALIDAD EXTREMA:
            1. DEFINICIÓN CRISTALINA: Identifica zonas borrosas y regenera micro-detalles (piel, ojos, texturas) con nitidez absoluta.
            2. CALIBRACIÓN TONAL: Elimina descoloramiento y recupera el rango dinámico. Colores vibrantes y profundos.
            3. RECONSTRUCCIÓN: Sana grietas, rayones y áreas faltantes con coherencia visual lógica.
            4. FIDELIDAD: El resultado debe parecer una fotografía moderna de alta resolución.
            
            FORMATO: Ajusta a ${aspectRatio}.
            CALIDAD: 4K Master.`,
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
      throw new Error("El motor no pudo procesar la imagen.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Imagen no generada por el motor.");
  } catch (error: any) {
    console.error("Critical Lab Error:", error);
    throw new Error("FALLO_MOTOR: " + (error.message || "Error desconocido."));
  }
}
