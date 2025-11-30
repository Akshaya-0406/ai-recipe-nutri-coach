// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// -------- OPENAI CLIENT --------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("OPENAI KEY FOUND?:", !!process.env.OPENAI_API_KEY);

// -------- HELPERS --------

// Safely get text from OpenAI response
function extractChatText(completion) {
  try {
    return completion.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}

// Safely parse JSON, log raw text when it fails
function safeParseJson(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("JSON parse failed. RAW TEXT from AI:", text);
    return fallback;
  }
}

// Fallback recipe generator (used if AI fails or key missing)
function generateFallbackRecipes({ ingredients, goal, diet }) {
  const baseIngredients = ingredients || "oats, curd, cucumber";

  const goalLabel =
    goal === "pcos_friendly"
      ? "PCOS-friendly"
      : goal === "weight_loss"
      ? "light & weight-friendly"
      : goal === "high_protein"
      ? "high-protein"
      : "balanced";

  const dietLabel =
    diet === "vegetarian"
      ? "vegetarian"
      : diet === "vegan"
      ? "vegan"
      : "non-vegetarian";

  const tagsBase = [goalLabel.toLowerCase(), dietLabel, "home-style"];

  return [
    {
      id: 1,
      title: `${goalLabel} ${dietLabel} bowl`,
      description: `A quick ${goalLabel.toLowerCase()} ${dietLabel} bowl using ${baseIngredients}.`,
      ingredientsList: [
        "Rolled oats – 1/2 cup",
        "Curd / yoghurt – 1/2 cup",
        "Cucumber – 1/4 cup (chopped)",
        "Roasted peanuts / chana – 2 tbsp",
        "Salt, pepper, spices as per taste",
      ],
      steps: [
        "Soak oats in warm water or milk for 5–10 minutes.",
        "Mix curd, cucumber and spices in a bowl.",
        "Add soaked oats, roasted peanuts and mix well.",
        "Chill for a few minutes and serve.",
      ],
      approxTimeMins: 15,
      nutrition: {
        calories:
          goal === "weight_loss" ? 260 : goal === "high_protein" ? 340 : 300,
        protein_g: goal === "high_protein" ? 18 : 12,
        carbs_g: 38,
        fat_g: 8,
        tags: [...tagsBase, "high_fiber", "simple"],
      },
    },
    {
      id: 2,
      title: `${goalLabel} one-pan meal`,
      description: `Comfortable one-pan ${dietLabel} meal with ${baseIngredients}, easy for busy days.`,
      ingredientsList: [
        "Any mixed veggies – 1 cup",
        "Protein of choice (paneer / egg / tofu) – 1/2 cup",
        "Minimal oil – 1 tsp",
        "Spices & herbs",
      ],
      steps: [
        "Heat a pan with minimal oil.",
        "Sauté chopped veggies until slightly soft.",
        "Add protein and cook till done.",
        "Season with salt, pepper and herbs.",
        "Serve with salad or a small portion of rice/millet.",
      ],
      approxTimeMins: 20,
      nutrition: {
        calories: goal === "weight_loss" ? 240 : 280,
        protein_g: 20,
        carbs_g: 22,
        fat_g: 8,
        tags: [...tagsBase, "quick", "one_pan", "weekday"],
      },
    },
  ];
}

// -------- PROMPTS --------

function buildRecipePrompt({ ingredients, goal, diet }) {
  return `
You are a nutrition-aware Indian cooking assistant for a learning app.

User:
- Ingredients: ${ingredients || "not provided"}
- Health goal: ${goal}
- Diet type: ${diet}

Health goals:
- "pcos_friendly": lower glycemic load, more fiber and protein, less sugar, less deep fried.
- "weight_loss": calorie-conscious, high veggie, moderate carbs, moderate fats.
- "high_protein": focus on protein sources.
- "balanced": overall balanced Indian home-style meal.

Diet types:
- "vegetarian"
- "vegan"
- "non_veg"

TASK:
Suggest at least 2 SIMPLE, Indian home-style recipes using the given ingredients and goal.

Return STRICT JSON ONLY (no markdown, no extra text):

{
  "recipes": [
    {
      "id": 1,
      "title": "string",
      "description": "short one-line description",
      "ingredientsList": ["string", "string"],
      "steps": ["step 1", "step 2"],
      "approxTimeMins": 20,
      "nutrition": {
        "calories": 320,
        "protein_g": 15,
        "carbs_g": 40,
        "fat_g": 8,
        "tags": ["pcos_friendly", "high_fiber", "vegetarian"]
      }
    }
  ]
}

Rules:
- IDs must be 1, 2, 3...
- Always at least 2 recipes.
- Simple, friendly language.
- This is general info only, not medical advice.
`;
}

function buildCoachPrompt({ message, goal, recipeSummary }) {
  return `
You are a gentle, friendly nutrition coach for an educational app.

User goal: ${goal}
Relevant recipe (may be empty): ${recipeSummary}

User says: ${message}

TASK:
Reply with supportive, simple guidance. Talk about balanced meals, PCOS-friendly ideas, protein, fiber, portion sizes, simple swaps, etc.
You are NOT a doctor and must always say that this is not medical advice.

Return STRICT JSON ONLY:

{
  "reply": "main answer in friendly, simple language...",
  "tips": [
    "short tip 1",
    "short tip 2"
  ]
}

Rules:
- "reply" is 2–5 short paragraphs max.
- "tips" is 2–4 bullets, very short.
- Include a reminder that this is NOT medical advice.
- No extra text outside JSON.
`;
}

// -------- ROUTES --------

// Recipes: AI + fallback
app.post("/api/recipes/generate", async (req, res) => {
  const { ingredients, goal = "pcos_friendly", diet = "vegetarian" } = req.body;

  // If no API key, just return fallback recipes (no 500)
  if (!process.env.OPENAI_API_KEY) {
    console.error("No OPENAI_API_KEY found. Using fallback recipes only.");
    const recipes = generateFallbackRecipes({ ingredients, goal, diet });
    return res.json({ recipes });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" }, // STEP 4: force JSON
      messages: [
        {
          role: "system",
          content: "You are a helpful nutrition-aware Indian cooking assistant.",
        },
        {
          role: "user",
          content: buildRecipePrompt({ ingredients, goal, diet }),
        },
      ],
    });

    const text = extractChatText(completion);
    const data = safeParseJson(text, null);

    if (!data || !Array.isArray(data.recipes)) {
      console.warn(
        "AI recipes missing or invalid, falling back to mock. Data:",
        data
      );
      const fallback = generateFallbackRecipes({ ingredients, goal, diet });
      return res.json({ recipes: fallback });
    }

    return res.json({ recipes: data.recipes });
  } catch (err) {
    console.error(
      "Error in /api/recipes/generate (using fallback):",
      err.response?.data || err.message || err
    );
    const fallback = generateFallbackRecipes({ ingredients, goal, diet });
    return res.json({ recipes: fallback });
  }
});

// Nutrition coach: AI + graceful fallback
app.post("/api/coach", async (req, res) => {
  const { message, goal = "pcos_friendly", recipe } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message is required." });
  }

  const recipeSummary = recipe
    ? `Title: ${recipe.title || ""}. Ingredients: ${(recipe.ingredientsList ||
        []
      ).join(", ")}.`
    : "";

  // If no key, return simple rule-based coach
  if (!process.env.OPENAI_API_KEY) {
    console.error("No OPENAI_API_KEY found. Using simple mock coach.");
    const fallbackReply =
      "I can give only simple, general guidance right now. Try to keep your meals balanced with some protein, fiber, and healthy fats. This is not medical advice.";
    return res.json({
      reply: fallbackReply,
      tips: [
        "Stay hydrated through the day.",
        "Include at least one protein source in each main meal.",
      ],
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" }, // STEP 4 here too
      messages: [
        {
          role: "system",
          content:
            "You are a kind, non-judgemental nutrition coach. You help with food choices but never give medical diagnosis.",
        },
        {
          role: "user",
          content: buildCoachPrompt({ message, goal, recipeSummary }),
        },
      ],
    });

    const text = extractChatText(completion);
    let data = safeParseJson(text, null);

    if (!data || typeof data.reply !== "string") {
      console.warn("Coach JSON invalid, falling back to raw text.");
      return res.json({
        reply:
          text ||
          "Here's some general nutrition guidance: try to keep meals balanced with protein, fiber and healthy fats. This is not medical advice.",
        tips: [
          "Stay hydrated through the day.",
          "Include at least one protein source in every main meal.",
        ],
      });
    }

    const tips = Array.isArray(data.tips) ? data.tips : [];

    return res.json({
      reply: data.reply,
      tips,
    });
  } catch (err) {
    console.error(
      "Error in /api/coach (using fallback):",
      err.response?.data || err.message || err
    );
    return res.json({
      reply:
        "I had some trouble connecting to the AI right now, so here is general guidance: try to keep your plate balanced with protein, vegetables, and moderate carbs. This is general information, not medical advice.",
      tips: [
        "Avoid skipping meals frequently.",
        "Try to add vegetables to common dishes like upma, dosa sides or rice bowls.",
      ],
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("AI Recipe & Nutrition Coach backend (with AI + fallback) is running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
