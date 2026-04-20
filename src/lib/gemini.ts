import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function extractRecipeFromUrl(url: string) {
  const prompt = `Extract recipe data from this URL: ${url}. 
  Return the data in a structured JSON format following the recipe schema. 
  Include title, hero image (if found), portions/servings, prep time (in minutes), categories, ingredients (strictly with name, amount as number, and unit), and steps (with text and image URL if found).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          heroImageUrl: { type: Type.STRING },
          servings: { type: Type.NUMBER },
          prepTime: { type: Type.NUMBER },
          categories: { type: Type.ARRAY, items: { type: Type.STRING } },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              },
              required: ["name", "amount", "unit"]
            }
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                imageUrl: { type: Type.STRING }
              },
              required: ["text"]
            }
          }
        },
        required: ["title", "ingredients", "steps"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
}
