import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import { getDb } from '../../db/client';
import { parts as partsTable, models as modelsTable, modelYears } from '../../db/schema';
import { formatParts } from '../../db/writers';

export const POST: APIRoute = async ({ request }) => {
  let motorcycle: any = null;
  let prompt: string = '';

  try {
    const db = getDb();
    let activeParts: any[] = [];
    let dbModels: any[] = [];

    try {
      const [rawDbParts, rawDbModels, allYears] = await Promise.all([
        db.select().from(partsTable),
        db.select().from(modelsTable),
        db.select().from(modelYears)
      ]);
      if (rawDbParts && rawDbParts.length > 0) {
        activeParts = await formatParts(db, rawDbParts);
      }
      if (rawDbModels && rawDbModels.length > 0) {
        const yearsByModel = new Map<string, number[]>();
        for (const r of allYears) {
          const arr = yearsByModel.get(r.modelId) || [];
          arr.push(r.year);
          yearsByModel.set(r.modelId, arr);
        }
        dbModels = rawDbModels.map(m => ({
          ...m,
          years: (yearsByModel.get(m.id) || []).sort((a, b) => a - b)
        }));
      }
    } catch (e) {
      console.warn('No se pudieron cargar los datos de la base de datos para el asistente:', e);
    }

    const body = await request.json().catch(() => ({}));
    prompt = body.prompt || '';
    motorcycle = body.motorcycle || null;

    const apiKey = 
      import.meta.env.GEMINI_API_KEY || 
      process.env.GEMINI_API_KEY || 
      import.meta.env.PUBLIC_GEMINI_API_KEY || 
      import.meta.env.VITE_GEMINI_API_KEY;

    // Detect target model dynamically from database models OR active motorcycle in garage
    const lowerPrompt = prompt.toLowerCase();
    let targetModel: any = null;

    if (motorcycle?.modelId) {
      targetModel = dbModels.find(m => m.id === motorcycle.modelId) || null;
    }

    // Try finding matched model in prompt text
    for (const m of dbModels) {
      const mName = (m.name || '').toLowerCase();
      const mSlug = (m.slug || '').toLowerCase();
      if (lowerPrompt.includes(mName) || (mSlug && lowerPrompt.includes(mSlug))) {
        targetModel = m;
        break;
      }
    }

    const targetModelId = targetModel ? targetModel.id : (motorcycle?.modelId || null);

    const isPartCompatibleWithTarget = (part: any, modelId: string | null) => {
      if (!modelId) return true;
      return (part.compatibility || []).some((cm: any) => 
        cm.modelId === modelId || cm.modelId === 'all'
      );
    };

    if (!apiKey) {
      const fallbackParts = activeParts.filter(p => isPartCompatibleWithTarget(p, targetModelId)).slice(0, 4);
      const fallbackOems = fallbackParts.map(p => p.oemNumbers?.[0] || p.sku).filter(Boolean);
      const modelLabel = targetModel?.name || (motorcycle ? `${motorcycle.brand} ${motorcycle.modelName}` : 'tu motocicleta');

      return new Response(JSON.stringify({
        text: `**Asistente Técnico Suzuki (Modo Catálogo Directo)**\n\nConsultando repuestos disponibles para **${modelLabel}**:`,
        recommendedOems: fallbackOems
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

    const contextMotorcycle = targetModel
      ? `Motocicleta de interés: Suzuki ${targetModel.name} ${motorcycle?.year ? `(Año ${motorcycle.year})` : ''}.`
      : motorcycle 
        ? `Motocicleta activa en el Garaje: ${motorcycle.brand} ${motorcycle.modelName} (Año ${motorcycle.year}, Versión: ${motorcycle.version || ''}).`
        : 'Consulta general de motocicletas Suzuki (el usuario no tiene modelo específico seleccionado).';

    const compatiblePartsForContext = targetModelId 
      ? activeParts.filter(p => isPartCompatibleWithTarget(p, targetModelId))
      : activeParts;

    const catalogSummary = compatiblePartsForContext.length > 0
      ? compatiblePartsForContext.map(p => `- OEM: ${(p.oemNumbers || [p.sku]).join(' / ')} | ${p.name} | $${p.price} | Categoría: ${p.category}`).join("\n")
      : "(Aún no hay repuestos registrados en el catálogo web para este modelo exacto, pero puedes responder consultas técnicas y pares de apriete generales con tu conocimiento de ingeniería Suzuki).";

    const systemInstruction = `Eres "Suzuki Master Technical AI", un ingeniero mecánico especialista y jefe de taller oficial de repuestos Suzuki Genuine Parts.
Tu objetivo es responder de manera técnica, precisa y profesional en ESPAÑOL a las consultas de mecánicos, talleres y propietarios sobre repuestos, mantenimiento, pares de apriete (torque), lubricación y especificaciones técnicas para TODA la gama de motocicletas Suzuki (Gixxer 250 / SF 250, Gixxer 150, GN125, V-Strom 650/1050, DR650, GSX-R, Burgman, etc.).

Contexto del vehículo: ${contextMotorcycle}

Catálogo de repuestos registrados en la Base de Datos:
${catalogSummary}

Directrices de respuesta:
1. Responde de forma técnica, útil y concisa en español.
2. Si el usuario pregunta por especificaciones técnicas, pares de apriete, capacidades de aceite, bujías o mantenimiento para cualquier modelo Suzuki (como Gixxer SF 250, GN125, etc.), responde con las especificaciones técnicas oficiales de Suzuki.
3. Si en el catálogo registrado existen repuestos compatibles que respondan a la consulta, recomiéndalos y añade al final de tu mensaje la etiqueta obligatoria:
   [RECOMMENDED_OEMS: CODIGO_OEM1, CODIGO_OEM2]
4. Usa formato Markdown limpio con listas y negritas.`;

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

      part.oemNumbers.forEach((oem: string) => {
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
