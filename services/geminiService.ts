
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
    throw new Error("API_KEY_MISSING: Por favor, asegúrate de haber configurado tu clave de API en el sistema.");
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
            text: `PROTOCOLO FOTOGRÁFICO DE ALTA DEFINICIÓN:
            
            SOLICITUD: ${userPrompt}.
            
            REGLAS DE LABORATORIO TIsera:
            1. RECONSTRUCCIÓN CONTEXTUAL: Si faltan partes de la imagen (bordes rotos, agujeros), reconstrúyelas de forma invisible utilizando el contexto circundante.
            2. MEJORA DE DEFINICIÓN Y TONOS: Dale una definición extrema a los detalles (ojos, piel, texturas). Recupera la riqueza de los tonos, corrigiendo descoloramientos y balance de blancos.
            3. SANADO DE DAÑOS: Elimina rayones, grietas, polvo y manchas químicas. No borres la textura natural de la fotografía.
            4. FIDELIDAD: El resultado debe parecer una fotografía real capturada con una cámara moderna de alta resolución, manteniendo el estilo original.
            5. FORMATO: Asegura que el resultado final respete la relación de aspecto ${aspectRatio}.
            
            Produce una imagen impecable de grado profesional.`,
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
      throw new Error("La IA no pudo completar el proceso de reconstrucción. Intenta con una imagen diferente.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No se detectó el componente visual en la respuesta de la IA.");
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    
    if (error.message?.includes("not found") || error.status === 404) {
      throw new Error("API_KEY_INVALID: La clave proporcionada no es válida para el modelo Gemini 2.5 Flash Image.");
    }
    
    throw new Error("ERROR_LABORATORIO: " + (error.message || "Fallo en el procesado de imagen."));
  }
}
