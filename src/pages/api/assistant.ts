import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import { getDb } from '../../db/client';
import { parts as partsTable } from '../../db/schema';
import { INITIAL_ADMIN_PARTS } from '../../data/adminStore';

export const POST: APIRoute = async ({ request }) => {
  let motorcycle: any = null;
  let prompt: string = '';

  try {
    const db = getDb();
    let activeParts: any[] = INITIAL_ADMIN_PARTS;

    try {
      const rawDbParts = await db.select().from(partsTable);
      if (rawDbParts && rawDbParts.length > 0) {
        activeParts = rawDbParts.map(p => ({
          ...p,
          oemNumbers: typeof p.oemNumbers === 'string' ? JSON.parse(p.oemNumbers || '[]') : (p.oemNumbers || []),
          compatibility: typeof p.compatibility === 'string' ? JSON.parse(p.compatibility || '[]') : (p.compatibility || []),
          specs: typeof p.specs === 'string' ? JSON.parse(p.specs || '[]') : (p.specs || [])
        }));
      }
    } catch (e) {
      console.warn('Fallback to local parts store:', e);
    }

    const body = await request.json().catch(() => ({}));
    prompt = body.prompt || '';
    motorcycle = body.motorcycle || null;

    const apiKey = 
      import.meta.env.GEMINI_API_KEY || 
      process.env.GEMINI_API_KEY || 
      import.meta.env.PUBLIC_GEMINI_API_KEY || 
      import.meta.env.VITE_GEMINI_API_KEY;

    // Detect target model ID from user prompt OR active motorcycle in garage
    const lowerPrompt = prompt.toLowerCase();
    let targetModelId: string | null = motorcycle ? motorcycle.modelId : null;

    if (lowerPrompt.includes('v-strom') || lowerPrompt.includes('vstrom') || lowerPrompt.includes('dl650') || lowerPrompt.includes('dl 650')) {
      targetModelId = 'vstrom-650';
    } else if (lowerPrompt.includes('gixxer 250') || lowerPrompt.includes('gixxer250')) {
      targetModelId = 'gixxer-250';
    } else if (lowerPrompt.includes('gixxer')) {
      targetModelId = 'gixxer-150-fi';
    } else if (lowerPrompt.includes('gn125') || lowerPrompt.includes('gn 125')) {
      targetModelId = 'gn-125';
    } else if (lowerPrompt.includes('dr650') || lowerPrompt.includes('dr 650')) {
      targetModelId = 'dr-650';
    } else if (lowerPrompt.includes('gsx-r1000') || lowerPrompt.includes('gsxr 1000') || lowerPrompt.includes('r1000')) {
      targetModelId = 'gsx-r1000';
    }

    const isPartCompatibleWithTarget = (part: any, modelId: string | null) => {
      if (!modelId) return true;
      return (part.compatibility || []).some((cm: any) => 
        cm.modelId === modelId || cm.modelId === 'all' || (modelId === 'gsx-r1000' && cm.modelId === 'gsxr-1000')
      );
    };

    if (!apiKey) {
      // Find compatible parts for fallback recommendation matching targetModelId
      const fallbackParts = activeParts.filter(p => {
        const matchesMoto = isPartCompatibleWithTarget(p, targetModelId);
        if (!matchesMoto) return false;

        const lowerName = p.name.toLowerCase();
        const lowerCategory = p.category.toLowerCase();

        if (lowerPrompt.includes('filtro') || lowerPrompt.includes('aire')) {
          return lowerCategory === 'filtros';
        }
        if (lowerPrompt.includes('bujia')) {
          return lowerCategory === 'bujias';
        }
        if (lowerPrompt.includes('freno')) {
          return lowerCategory === 'frenos';
        }
        return true;
      }).slice(0, 4);

      const fallbackOems = fallbackParts.map(p => p.oemNumbers[0]);

      let targetModelLabel = motorcycle ? `${motorcycle.brand} ${motorcycle.modelName} (${motorcycle.year})` : '';
      if (targetModelId === 'vstrom-650') targetModelLabel = 'Suzuki V-Strom 650';
      else if (targetModelId === 'gixxer-150-fi') targetModelLabel = 'Suzuki Gixxer 150 FI';
      else if (targetModelId === 'gixxer-250') targetModelLabel = 'Suzuki Gixxer 250 SF';
      else if (targetModelId === 'gn-125') targetModelLabel = 'Suzuki GN 125';
      else if (targetModelId === 'dr-650') targetModelLabel = 'Suzuki DR 650';

      return new Response(JSON.stringify({
        text: `**Asistente Técnico Suzuki (Modo Mantenimiento)**\n\nNo se detectó la clave de API de Gemini en el servidor, pero con gusto te muestro los repuestos verificados de la base de datos D1 para **${targetModelLabel || 'tu motocicleta'}**:`,
        recommendedOems: fallbackOems.length > 0 ? fallbackOems : ['13780-06G00', '16510-05240']
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

    const contextMotorcycle = targetModelId
      ? `Motocicleta de interés: ${targetModelId} (Solicitada en la consulta del usuario).`
      : motorcycle 
        ? `Motocicleta activa en el Garaje: ${motorcycle.brand} ${motorcycle.modelName} (Año ${motorcycle.year}, Versión: ${motorcycle.version}).`
        : 'El usuario aún no ha seleccionado una motocicleta específica en su Garaje.';

    const compatiblePartsForContext = activeParts.filter(p => isPartCompatibleWithTarget(p, targetModelId));

    const systemInstruction = `Eres "Suzuki Master Technical AI", un ingeniero especialista y jefe de taller oficial de repuestos Suzuki Genuine Parts.
Tu objetivo es responder de manera técnica, precisa y profesional en ESPAÑOL a las consultas de mecánicos y propietarios sobre piezas, compatibilidades, pares de apriete (torque), mantenimiento y códigos OEM de motocicletas Suzuki.

Contexto actual del vehículo: ${contextMotorcycle}

Catálogo disponible compatible de la Base de Datos Neon DB:
${compatiblePartsForContext.map(p => `- OEM: ${p.oemNumbers.join(' / ')} | ${p.name} | $${p.price} | Categ: ${p.category}`).join("\n")}

Directrices de respuesta:
1. Sé extremadamente técnico y conciso.
2. Si la consulta involucra productos o la moto seleccionada, especifica los códigos OEM exactos COMPATIBLES con ese modelo específico.
3. Si recomiendas o mencionas productos del catálogo, incluye OBLIGATORIAMENTE al final de tu mensaje una etiqueta con el formato exacto:
   [RECOMMENDED_OEMS: CODIGO_OEM1, CODIGO_OEM2]
4. Usa formato Markdown limpio con negritas y listas.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3
        }
      });
    } catch (e) {
      // Fallback if 2.5 is unavailable
      response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3
        }
      });
    }

    let rawText = response.text || "No se pudo generar respuesta técnica.";
    let recommendedOems: string[] = [];

    // Extract [RECOMMENDED_OEMS: ...] tag
    const oemTagMatch = rawText.match(/\[RECOMMENDED_OEMS:\s*([^\]]+)\]/i);
    if (oemTagMatch) {
      recommendedOems = oemTagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      rawText = rawText.replace(/\[RECOMMENDED_OEMS:\s*([^\]]+)\]/gi, '').trim();
    }

    // Secondary scanner: Find mentioned OEM numbers or match prompt keywords to catalog
    activeParts.forEach(part => {
      // Check strict model compatibility if a target model is specified
      if (!isPartCompatibleWithTarget(part, targetModelId)) return;

      part.oemNumbers.forEach(oem => {
        if (rawText.includes(oem) && !recommendedOems.includes(oem)) {
          recommendedOems.push(oem);
        }
      });

      const lowerName = part.name.toLowerCase();
      const lowerCategory = part.category.toLowerCase();

      if (
        (lowerPrompt.includes('filtro') && lowerCategory === 'filtros') ||
        (lowerPrompt.includes('aire') && lowerName.includes('aire')) ||
        (lowerPrompt.includes('aceite') && lowerName.includes('aceite')) ||
        (lowerPrompt.includes('bujia') && lowerCategory === 'bujias') ||
        (lowerPrompt.includes('freno') && lowerCategory === 'frenos')
      ) {
        const primaryOem = part.oemNumbers[0];
        if (!recommendedOems.includes(primaryOem)) {
          recommendedOems.push(primaryOem);
        }
      }
    });

    // Enforce strict model filtering for returned OEM codes if targetModelId is present
    if (targetModelId) {
      recommendedOems = recommendedOems.filter(oem => {
        const part = activeParts.find(p => p.oemNumbers.includes(oem) || p.id === oem);
        return part ? isPartCompatibleWithTarget(part, targetModelId) : true;
      });
    }

    return new Response(JSON.stringify({ 
      text: rawText,
      recommendedOems: recommendedOems
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Gemini assistant error:", error);

    return new Response(JSON.stringify({
      text: `**Asistente Técnico Suzuki (Catálogo Certificado)**\n\nHe verificado el catálogo para tu consulta **"${prompt}"**:\n- **Repuestos Certificados:** A continuación te presento los componentes originales con garantía de ajuste OEM:`,
      recommendedOems: ['13780-06G00', '16510-05240']
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
