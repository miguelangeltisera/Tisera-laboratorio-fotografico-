
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types.ts";

export async function enhanceImage(
  base64Data: string,
  mimeType: string,
  userPrompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> {
  // Utilizamos la clave proporcionada por el usuario para asegurar funcionalidad inmediata
  // Mantenemos process.env.API_KEY como fallback
  const apiKey = process.env.API_KEY || "AIzaSyBoes9G-zxPGTZ41D0pTHjwre3-j2dNKaU";

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
            text: `PROTOCOLO DE RECONSTRUCCIÓN MAESTRA (Miguel Ángel Tisera Lab):
            
            ACCIÓN SOLICITADA: ${userPrompt}.
            
            ESTÁNDARES OBLIGATORIOS:
            1. DEFINICIÓN ULTRA-HD: Reconstruye texturas, poros y detalles faciales con máxima nitidez. Elimina el ruido digital y el grano excesivo.
            2. CALIBRACIÓN DE TONOS: Ajusta el balance de blancos, satura colores naturales y profundiza los negros. La imagen debe perder el tono "lavado".
            3. SANACIÓN QUIRÚRGICA: Borra rayones, motas de polvo y grietas físicas.
            4. ILUMINACIÓN PRO: Optimiza las sombras y luces para un acabado cinematográfico.
            
            FORMATO: ${aspectRatio}.
            RESULTADO: Imagen de alta fidelidad visual lista para impresión profesional.`,
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
      throw new Error("El motor Gemini no pudo generar la imagen. Verifica el formato del archivo.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No se recibió respuesta visual del servidor.");
  } catch (error: any) {
    console.error("Critical Engine Error:", error);
    throw new Error("ERROR_LABORATORIO: " + (error.message || "Fallo en la conexión con la IA."));
  }
}
