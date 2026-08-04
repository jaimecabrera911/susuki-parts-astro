import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import { SUZUKI_PARTS } from '../../data/suzukiData';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt, motorcycle } = await request.json();
    const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({
        text: `**Asistente Técnico Suzuki (Modo Mantenimiento)**\n\nNo se detectó la clave de API de Gemini en el servidor, pero con gusto te ayudo con la información del catálogo:\n- **Para tu ${motorcycle?.modelName || 'motocicleta'} (${motorcycle?.year || 'Año'}):** Recomendamos usar siempre repuestos originales con código OEM.\n- **Filtro de Aceite:** Código OEM 16510-05240 (Reemplazo cada 3.000 - 5.000 km).\n- **Bujía Iridium:** Código OEM 09482-00406 (Calibración 0.8 - 0.9 mm).`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contextMotorcycle = motorcycle 
      ? `Motocicleta activa en el Garaje: ${motorcycle.brand} ${motorcycle.modelName} (Año ${motorcycle.year}, Versión: ${motorcycle.version}).`
      : 'El usuario aún no ha seleccionado una motocicleta específica en su Garaje.';

    const systemInstruction = `Eres "Suzuki Master Technical AI", un ingeniero especialista y jefe de taller oficial de repuestos Suzuki Genuine Parts.
Tu objetivo es responder de manera técnica, precisa y profesional en ESPAÑOL a las consultas de mecánicos y propietarios sobre piezas, compatibilidades, pares de apriete (torque), mantenimiento y códigos OEM de motocicletas Suzuki.

Contexto actual del vehículo: ${contextMotorcycle}

Catálogo disponible en el sistema:
${SUZUKI_PARTS.map(p => `- OEM: ${p.oemNumber} | ${p.name} | $${p.price} | Categ: ${p.category}`).join("\n")}

Directrices de respuesta:
1. Sé extremadamente técnico y conciso.
2. Si la consulta involucra la moto seleccionada (${motorcycle?.modelName || 'ninguna'}), verifica compatibilidades técnicas exactas.
3. Menciona códigos OEM Suzuki Genuine cuando sea relevante.
4. Usa formato Markdown limpio con negritas y listas.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3
      }
    });

    return new Response(JSON.stringify({ text: response.text || "No se pudo generar respuesta técnica." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Gemini assistant error:", error);
    return new Response(JSON.stringify({ error: "Error en el asistente técnico Gemini: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
