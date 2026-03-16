
import { GoogleGenAI, Type } from "@google/genai";
import { PricingEstimate, RouteAnalysis, HouseType, Appointment, Expense, Payout } from "../types";

// Note: Maps grounding is only supported in Gemini 2.5 series models.
// Use 'gemini-flash-lite-latest' for 2.5 series and 'gemini-3-flash-preview' or 'gemini-3-pro-preview' for 3.x series.

export const findPropertyInfo = async (address: string): Promise<{
  city: string;
  state: string;
  zipCode: string;
  formattedAddress: string;
  propertyDescription: string;
  mapsUrl?: string;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Validate the following address and return its components (city, state, zipCode, formattedAddress) and a brief description of the property type: "${address}". Return the data as a JSON object.`;
    
    // Maps grounding requires 2.5 series models.
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: { 
        tools: [{ googleMaps: {} }],
      }
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        ...data,
        mapsUrl: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find(c => c.maps)?.maps?.uri
      };
    }

    // Fallback parsing if JSON is not returned directly
    return {
      city: "Detected",
      state: "US",
      zipCode: "",
      formattedAddress: address,
      propertyDescription: "Verified by Gemini AI",
      mapsUrl: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find(c => c.maps)?.maps?.uri
    };
  } catch (error) {
    console.error("AI Address Search Error:", error);
    throw error;
  }
};

export const calculateSmartTransaction = async (data: {
  amount: number;
  duration: number;
  payouts: Payout[];
  address?: string;
}): Promise<{ netProfit: number; taxReserve: number; operationalCost: number; mathNotes: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Analise financeiramente este serviço de limpeza: Valor $${data.amount}, Duração ${data.duration}min, Payouts: ${JSON.stringify(data.payouts)}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            netProfit: { type: Type.NUMBER },
            taxReserve: { type: Type.NUMBER },
            operationalCost: { type: Type.NUMBER },
            mathNotes: { type: Type.STRING }
          },
          required: ["netProfit", "taxReserve", "operationalCost", "mathNotes"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return {
      netProfit: 0,
      taxReserve: 0,
      operationalCost: 0,
      mathNotes: "Error calculating."
    };
  }
};

export const translateToFormalEnglish = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate to formal business English: "${text}"`,
  });
  return response.text || text;
};

// Fix for error in FinanceManager.tsx: Added missing getBusinessConsultancy function
export const getBusinessConsultancy = async (appointments: Appointment[], expenses: Expense[]): Promise<{
  healthScore: number,
  analysis: string,
  actionPlan: string[],
  profitabilityInsight: string
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analise a saúde financeira e operacional desta empresa de limpeza com base nos dados reais:
Agendamentos: ${JSON.stringify(appointments)}
Despesas: ${JSON.stringify(expenses)}

Forneça um relatório estratégico detalhado em Português-BR.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.NUMBER, description: "A score from 0 to 100 representing business health" },
            analysis: { type: Type.STRING, description: "Detailed financial analysis of the period" },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of recommended business actions" },
            profitabilityInsight: { type: Type.STRING, description: "Key insight about profitability or cost savings" }
          },
          required: ["healthScore", "analysis", "actionPlan", "profitabilityInsight"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Consultancy Error:", error);
    return {
      healthScore: 50,
      analysis: "Erro ao gerar análise detalhada pelo Gemini Pro.",
      actionPlan: ["Revisar lançamentos manuais no financeiro"],
      profitabilityInsight: "Não foi possível extrair insights automáticos agora."
    };
  }
};

export const getSmartPricing = async (
  zipCode: string,
  bedrooms: number,
  bathrooms: number,
  sqft: number,
  serviceType: string,
  houseType: HouseType
): Promise<PricingEstimate> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Análise de preço de mercado para limpeza residencial em ZIP ${zipCode}. Imóvel ${houseType}, ${bedrooms} quartos, ${bathrooms} banheiros, aprox ${sqft} sqft. Retorne um JSON com os campos: low (number), high (number), marketReasoning (string).`;
  
  // Maps grounding requires 2.5 series models.
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: prompt,
    config: { 
      tools: [{ googleMaps: {} }, { googleSearch: {} }]
    }
  });

  const jsonMatch = response.text.match(/\{[\s\S]*\}/);
  const data = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");

  // Guideline: Extract grounding sources from groundingMetadata and list them on the web app
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources = groundingChunks
    ?.map(chunk => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      if (chunk.maps) return { title: chunk.maps.title, uri: chunk.maps.uri };
      return null;
    })
    .filter(Boolean) as { title: string; uri: string }[] || [];

  return { 
    low: data.low || 0, 
    high: data.high || 0, 
    marketReasoning: data.marketReasoning || "Calculado via IA", 
    sources 
  };
};
