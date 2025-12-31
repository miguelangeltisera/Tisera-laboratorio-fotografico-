
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types.ts";

export async function enhanceImage(
  base64Data: string,
  mimeType: string,
  userPrompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> {
  // Obtenemos la clave directamente del entorno en el momento de la llamada
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY no detectada. Por favor, asegúrate de haber configurado el secreto 'API_KEY' en tu entorno de despliegue.");
  }

  // Instanciamos el cliente justo antes de usarlo para evitar race conditions con llaves seleccionadas
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
            text: `PROTOCOLO DE RECONSTRUCCIÓN FOTOGRÁFICA AVANZADA:
            
            ACCIÓN REQUERIDA: ${userPrompt}.
            
            REGLAS DE LABORATORIO:
            1. RECONSTRUCCIÓN CONTEXTUAL: Si detectas bordes faltantes, esquinas rotas o áreas negras, rellénalas basándote en el contenido circundante con una coherencia del 100%.
            2. SANADO QUIRÚRGICO: Localiza y elimina grietas de papel, rayones profundos, polvo y manchas químicas. No borres detalles naturales de la imagen original.
            3. MEJORA DE DEFINICIÓN HD: Refina los bordes, mejora la claridad de los ojos y la textura de la piel. Asegura que el resultado sea nítido y libre de desenfoque IA.
            4. RECUPERACIÓN TONAL: Corrige la decoloración. Si la foto es antigua, recupera la riqueza de los negros y la naturalidad de los tonos de piel.
            5. ADAPTACIÓN DE LIENZO: Ajusta el resultado al formato ${aspectRatio} reconstruyendo lo necesario.
            
            RESULTADO FINAL: Una restauración digna de museo, lista para impresión profesional.`,
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
      throw new Error("La IA no pudo procesar la reconstrucción. Intenta con una imagen más clara.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No se pudo extraer la imagen restaurada de la respuesta.");
  } catch (error: any) {
    console.error("Error en Gemini Service:", error);
    
    // Si el error es específicamente de falta de permisos o entidad no encontrada
    if (error.message?.includes("not found") || error.status === 404) {
      throw new Error("La API Key no es válida para este modelo. Por favor, selecciona una clave de un proyecto de pago con Gemini 2.5 habilitado.");
    }
    
    throw new Error("Fallo en el laboratorio: " + (error.message || "Error desconocido durante la restauración"));
  }
}
