
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types.ts";

export async function enhanceImage(
  base64Data: string,
  mimeType: string,
  userPrompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> {
  // Priorizamos process.env.API_KEY porque es el que se actualiza si el usuario elige una clave en el diálogo
  // La clave anterior queda como respaldo estático
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
            text: `PROTOCOLO DE RECONSTRUCCIÓN PROFESIONAL (Tisera Lab):
            
            ACCIÓN: ${userPrompt}.
            
            REGLAS TÉCNICAS:
            1. DEFINICIÓN: Regenera texturas faciales y bordes con nitidez absoluta.
            2. COLOR: Calibración vibrante y natural. Elimina el aspecto lavado.
            3. LIMPIEZA: Borra rayones, motas y grietas físicas.
            4. ACABADO: Master HD de alta fidelidad.`,
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
      throw new Error("El motor no pudo procesar la imagen debido a límites de seguridad o cuota.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Respuesta visual no recibida.");
  } catch (error: any) {
    console.error("Critical Engine Error:", error);
    // Propagamos el error para que App.tsx pueda identificar el 429
    throw error;
  }
}
