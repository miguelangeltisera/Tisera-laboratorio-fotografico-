
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
    throw new Error("API_KEY_MISSING: No se detectó la clave de API. Verifica la configuración de variables en Netlify.");
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
            
            DIRECTRICES CRÍTICAS PARA EL RESULTADO:
            1. DEFINICIÓN EXTREMA: Identifica zonas borrosas y regenera los detalles (pestañas, textura de piel, tejidos) con nitidez microscópica.
            2. CALIBRACIÓN TONAL PROFUNDA: Elimina neblinas, corrige el balance de blancos y recupera el rango dinámico original. Los colores deben ser vibrantes, naturales y profundos.
            3. RECONSTRUCCIÓN FORENSE: Si hay bordes rotos o áreas faltantes, reconstrúyelas con coherencia absoluta basándote en la lógica visual de la escena.
            4. LIMPIEZA DE SUPERFICIE: Borra quirúrgicamente rayones, motas de polvo y grietas físicas sin alterar el grano natural de la foto.
            5. FIDELIDAD: El resultado final debe parecer una fotografía real capturada con equipo profesional moderno de alta resolución.
            
            FORMATO: Ajusta el resultado final a la relación de aspecto ${aspectRatio}.
            CALIDAD: Genera una imagen impecable de resolución 4K.`,
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
      throw new Error("La IA no pudo generar una reconstrucción válida. Prueba con una imagen menos dañada.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("El bloque de imagen no se encontró en la respuesta del motor.");
  } catch (error: any) {
    console.error("Critical Lab Error:", error);
    if (error.status === 403 || error.message?.includes("key")) {
      throw new Error("API_KEY_INVALID: La clave configurada en Netlify no tiene permisos suficientes para el modelo Gemini 2.5 Flash Image.");
    }
    throw new Error("FALLO_CRÍTICO: " + (error.message || "Error desconocido en el motor de restauración."));
  }
}
