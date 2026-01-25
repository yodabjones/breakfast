
import { GoogleGenAI } from "@google/genai";
import { RatingEntry } from "../types";

/**
 * Service to interact with Gemini API for generating breakfast restaurant summaries.
 */
export const getAIBreakfastSummary = async (restaurantName: string, entries: RatingEntry[]): Promise<string> => {
  // Always use process.env.API_KEY directly in the initialization object.
  // We initialize the GoogleGenAI instance inside the function to ensure it uses the most current environment state.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const dataContext = entries.map(e => ({
    user: e.username,
    date: e.date,
    scores: e.ratings,
    notes: e.notes
  }));

  const prompt = `
    Analyze these breakfast restaurant reviews for "${restaurantName}" and provide a concise, professional 2-sentence summary of the overall consensus. 
    Focus on what people love and any consistent issues mentioned in the notes.
    
    Data: ${JSON.stringify(dataContext)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    // Directly access the .text property from GenerateContentResponse.
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI is currently finishing its morning coffee. Please try again later.";
  }
};
