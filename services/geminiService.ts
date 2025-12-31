
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
    throw new Error("API_KEY_MISSING: No se detectó la clave de API. Verifica la configuración en Netlify.");
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
            text: `PROTOCOLO DE RECONSTRUCCIÓN FORENSE (TIsera Master Lab):
            
            ACCIÓN: ${userPrompt}.
            
            ESTÁNDARES DE ALTO RENDIMIENTO:
            1. DEFINICIÓN EXTREMA: Localiza bordes borrosos y píxeles difusos. Regenera micro-texturas (pestañas, poros, fibras) con nitidez cristalina.
            2. CALIBRACIÓN TONAL DE PROFUNDIDAD: Elimina el "velo" gris/amarillo. Recupera el rango dinámico con negros puros y blancos limpios.
            3. RECONSTRUCCIÓN INTEGRAL: Si hay esquinas rotas o áreas faltantes, reconstrúyelas con coherencia visual absoluta basada en el entorno.
            4. LIMPIEZA QUIRÚRGICA: Borra rayones, grietas de papel y manchas de humedad sin alterar el grano natural de la fotografía.
            5. MEJORES TONOS DE PIEL: Asegura que los rostros recuperen su color natural y luz profesional.
            6. FORMATO: Ajusta el resultado final a la relación de aspecto ${aspectRatio}.
            
            El resultado debe ser una imagen de resolución 4K lista para exposición.`,
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
      throw new Error("El motor no pudo procesar la imagen. Intenta con un archivo más pesado.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No se recibió el bloque visual de la IA.");
  } catch (error: any) {
    console.error("Critical Lab Error:", error);
    if (error.status === 403 || error.message?.includes("key")) {
      throw new Error("API_KEY_INVALID: La clave proporcionada no tiene permisos suficientes.");
    }
    throw new Error("FALLO_SISTEMA: " + (error.message || "Error desconocido."));
  }
}
