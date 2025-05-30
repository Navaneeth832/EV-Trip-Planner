
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { UserPreferences } from '../types';

export class GeminiService {
  private static instance: GeminiService;
  private ai: GoogleGenAI | null = null;

  private constructor() {
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.warn("Gemini API Key is not configured. Activity suggestions will be limited or disabled.");
    }
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public async getNearbyActivities(
    chargerLocation: string, 
    chargingDurationMinutes: number,
    preferences: UserPreferences
  ): Promise<string[]> {
    if (!this.ai) {
      return ["Activity suggestions are unavailable (API key not configured)."];
    }

    let preferencesString = "";
    if (preferences.preferFoodOptions) preferencesString += " food options (cafes, restaurants),";
    if (preferences.petFriendlySpots) preferencesString += " pet-friendly spots,";
    // Note: "avoidSlowChargers" is a charging station selection criteria, not directly for activity generation.
    
    if (preferencesString.length > 0) {
        preferencesString = `Consider these preferences: ${preferencesString.slice(0, -1)}.`;
    }


    const prompt = `
      You are a travel assistant suggesting activities near an EV charging station.
      An EV is charging at a location described as "${chargerLocation}".
      The charging will take approximately ${Math.round(chargingDurationMinutes)} minutes.
      Suggest 1 to 3 brief, interesting activities that can be done within this time and are likely within walking distance (e.g., 5-15 minutes walk).
      Examples: "Grab a coffee at 'The Daily Grind' - 2 min walk", "Visit 'Miniature World Exhibit' - 10 min walk", "Relax at 'City Park Bench' - 5 min walk".
      ${preferencesString}
      Provide the suggestions as a simple list, each item on a new line. Do not use markdown list formatting (like '-' or '*').
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17", // Corrected model name
        contents: prompt,
      });
      
      const text = response.text;
      if (!text) {
        return ["No specific activities suggested. Enjoy your break!"];
      }
      return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    } catch (error) {
      console.error("Error fetching activities from Gemini:", error);
      throw new Error("Failed to fetch activity suggestions from Gemini.");
    }
  }
}
