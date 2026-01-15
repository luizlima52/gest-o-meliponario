
import { GoogleGenAI } from "@google/genai";

export const generateBeeAdvice = async (prompt: string, contextData?: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "Erro: Chave de API não configurada. Por favor, configure a chave da API.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let systemInstruction = `Você é um Meliponicultor especialista (criador de abelhas sem ferrão) com décadas de experiência no Brasil. 
    Você fornece conselhos técnicos, precisos e práticos sobre manejo, divisão, alimentação e saúde de abelhas nativas (Jataí, Mandaçaia, Uruçu, etc.).
    Responda sempre em Português do Brasil. Seja conciso e útil. Use formatação Markdown.`;

    if (contextData) {
      systemInstruction += `\n\nContexto atual do meliponário do usuário:\n${contextData}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Não foi possível gerar uma resposta.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Desculpe, ocorreu um erro ao consultar o especialista virtual.";
  }
};
