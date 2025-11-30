// client/src/App.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  UtensilsCrossed,
  MessageCircle,
  Flame,
  Leaf,
  HeartPulse,
  User2,
  Bookmark,
} from "lucide-react";
import { motion } from "framer-motion";

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Safely join base + path (no //api and no missing slash)
const joinUrl = (base, path) => {
  const cleanBase = base.replace(/\/+$/, "");   // remove trailing slashes
  const cleanPath = path.replace(/^\/+/, "");   // remove leading slashes
  return `${cleanBase}/${cleanPath}`;
};

const API_BASE_URL = RAW_API_BASE_URL;

function App() {
  // Core state
  const [ingredients, setIngredients] = useState("");
  const [goal, setGoal] = useState("pcos_friendly");
  const [diet, setDiet] = useState("vegetarian");
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Coach state
  const [coachMessages, setCoachMessages] = useState([
    {
      from: "bot",
      text: "Hey! I’m your gentle nutrition coach 🤍 Ask me about your meal, PCOS-friendly swaps, or healthier snack ideas.",
    },
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);

  // Saved recipes & profile
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState("home"); // home | saved | profile
  const [profile, setProfile] = useState({
    diet: "vegetarian",
    goal: "pcos_friendly",
    allergies: "",
  });

  const selectedRecipe =
    recipes.find((r) => r.id === selectedRecipeId) || null;

  // Load saved recipes + profile from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("savedRecipes")) || [];
      setSavedRecipes(stored);
    } catch (_) {
      setSavedRecipes([]);
    }

    try {
      const storedProfile =
        JSON.parse(localStorage.getItem("nutriProfile")) || null;
      if (storedProfile) {
        setProfile(storedProfile);
        setGoal(storedProfile.goal || "pcos_friendly");
        setDiet(storedProfile.diet || "vegetarian");
      }
    } catch (_) {
      // ignore
    }
  }, []);

  // Persist saved recipes + profile
  useEffect(() => {
    localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    localStorage.setItem("nutriProfile", JSON.stringify(profile));
  }, [profile]);

  // ---------- Recipe generation ----------
  const handleGenerateRecipes = async () => {
    if (!ingredients.trim()) {
      alert("Please enter at least some ingredients.");
      return;
    }

    try {
      setLoadingRecipes(true);
      setRecipes([]);
      setSelectedRecipeId(null);

      const res = await axios.post(
        joinUrl(API_BASE_URL, "/api/recipes/generate"),
        {
          ingredients,
          goal,
          diet,
        }
      );

      const newRecipes = res.data.recipes || [];
      setRecipes(newRecipes);
      if (newRecipes.length > 0) {
        setSelectedRecipeId(newRecipes[0].id);
      }
    } catch (err) {
      console.error(err);
      alert(
        "Error generating recipes. Please check if the backend server is running."
      );
    } finally {
      setLoadingRecipes(false);
    }
  };

  // ---------- Coach chat ----------
  const handleSendToCoach = async () => {
    const msg = coachInput.trim();
    if (!msg) return;

    const payloadText = msg;
    setCoachMessages((prev) => [...prev, { from: "user", text: msg }]);
    setCoachInput("");
    setCoachLoading(true);

    try {
      const res = await axios.post(
        joinUrl(API_BASE_URL, "/api/coach"),
        {
          message: payloadText,
          goal,
          recipe: selectedRecipe || null,
        }
      );

      const replyText =
        res.data?.reply ||
        "Here’s some general guidance: keep meals balanced & listen to your body. This isn’t medical advice.";

      const tips = res.data?.tips || [];

      setCoachMessages((prev) => [
        ...prev,
        { from: "bot", text: replyText },
        ...tips.map((t) => ({ from: "bot", text: `💡 Tip: ${t}` })),
      ]);
    } catch (err) {
      console.error(err);
      setCoachMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "I had trouble replying just now. Please check your server and try again.",
        },
      ]);
    } finally {
      setCoachLoading(false);
    }
  };

  // ---------- Save / Unsave recipes ----------
  const handleSaveRecipe = (recipe) => {
    if (!recipe) return;
    const exists = savedRecipes.some(
      (r) => r.title === recipe.title && r.approxTimeMins === recipe.approxTimeMins
    );
    if (exists) {
      alert("This recipe is already saved ⭐");
      return;
    }
    const updated = [...savedRecipes, recipe];
    setSavedRecipes(updated);
    alert("Recipe saved ⭐ Check the Saved tab.");
  };

  const handleUnsaveRecipe = (index) => {
    const updated = savedRecipes.filter((_, i) => i !== index);
    setSavedRecipes(updated);
  };

  // ---------- UI helpers ----------
  const tabButtonClass = (tab) =>
    `primary-btn ${activeTab === tab ? "" : "secondary-btn"}`;

  return (
    <div className="app-root">
      <div className="app-shell">
        {/* Header */}
        <header className="app-header">
          <div className="app-title-wrap">
            <UtensilsCrossed className="logo-icon" />
            <div>
              <h1 className="app-title">AI Recipe & Nutrition Coach</h1>
              <p className="app-subtitle">
                Turn random ingredients into balanced meals with gentle, goal-aware tips.
              </p>
            </div>
          </div>
          <div className="header-pill-row">
            <span className="pill pill-soft">
              <Leaf className="pill-icon" />
              Goal aware
            </span>
            <span className="pill pill-soft">
              <HeartPulse className="pill-icon" />
              Not medical advice
            </span>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ marginTop: 10, marginBottom: 4, display: "flex", gap: 8 }}>
          <button
            className={tabButtonClass("home")}
            onClick={() => setActiveTab("home")}
          >
            Home
          </button>
          <button
            className={tabButtonClass("saved")}
            onClick={() => setActiveTab("saved")}
          >
            <Bookmark
              style={{ width: 16, height: 16, marginRight: 6 }}
            />
            Saved recipes
          </button>
          <button
            className={tabButtonClass("profile")}
            onClick={() => setActiveTab("profile")}
          >
            <User2
              style={{ width: 16, height: 16, marginRight: 6 }}
            />
            Profile
          </button>
        </div>

        {/* Main content */}
        <main className="app-main">
          {/* ---------- HOME TAB ---------- */}
          {activeTab === "home" && (
            <>
              {/* Left column: input + coach */}
              <section className="left-column">
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="card-title">1. Tell me what you have</h2>
                  <p className="card-helper">
                    Type ingredients you have at home. I&apos;ll suggest 2–3 simple,
                    Indian-style recipes.
                  </p>

                  <textarea
                    className="ingredients-input"
                    placeholder="Example: oats, curd, cucumber, peanuts, onions..."
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    rows={4}
                  />

                  <div className="options-row">
                    <div className="field">
                      <label>Health goal</label>
                      <select
                        value={goal}
                        onChange={(e) => {
                          setGoal(e.target.value);
                          setProfile((prev) => ({
                            ...prev,
                            goal: e.target.value,
                          }));
                        }}
                      >
                        <option value="pcos_friendly">PCOS-friendly</option>
                        <option value="weight_loss">Light / weight management</option>
                        <option value="high_protein">High protein</option>
                        <option value="balanced">Balanced meal</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Diet type</label>
                      <select
                        value={diet}
                        onChange={(e) => {
                          setDiet(e.target.value);
                          setProfile((prev) => ({
                            ...prev,
                            diet: e.target.value,
                          }));
                        }}
                      >
                        <option value="vegetarian">Vegetarian</option>
                        <option value="vegan">Vegan</option>
                        <option value="non_veg">Non-veg</option>
                      </select>
                    </div>
                  </div>

                  <button
                    className="primary-btn"
                    onClick={handleGenerateRecipes}
                    disabled={loadingRecipes}
                  >
                    {loadingRecipes ? "Thinking..." : "Generate recipes"}
                  </button>

                  <p className="tiny-note">
                    Using your profile: <strong>{profile.diet}</strong>, goal{" "}
                    <strong>{profile.goal.replaceAll("_", " ")}</strong>
                    {profile.allergies ? `, avoid: ${profile.allergies}` : ""}
                    .
                    <br />
                    Nutrition info is approximate and for learning only, not medical advice.
                  </p>
                </motion.div>

                <motion.div
                  className="card coach-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="coach-header">
                    <div className="coach-title-wrap">
                      <MessageCircle className="coach-icon" />
                      <div>
                        <h2 className="card-title">2. Ask the nutrition coach</h2>
                        <p className="card-helper">
                          Ask about PCOS-friendliness, portion size, swaps, or snack
                          ideas.
                        </p>
                      </div>
                    </div>
                    {selectedRecipe && (
                      <span className="pill pill-recipe">
                        Linked to: {selectedRecipe.title}
                      </span>
                    )}
                  </div>

                  <div className="coach-chat">
                    {coachMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`chat-bubble ${
                          m.from === "user" ? "chat-user" : "chat-bot"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))}
                  </div>

                  <div className="coach-input-row">
                    <textarea
                      className="coach-input"
                      placeholder="Example: Is this okay as an evening PCOS snack? How can I add more protein?"
                      rows={2}
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                    />
                    <button
                      className="primary-btn secondary-btn"
                      onClick={handleSendToCoach}
                      disabled={coachLoading || !coachInput.trim()}
                    >
                      {coachLoading ? "Replying..." : "Ask coach"}
                    </button>
                  </div>
                </motion.div>
              </section>

              {/* Right column: recipes */}
              <section className="right-column">
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <div className="recipes-header">
                    <h2 className="card-title">Your recipes</h2>
                    <span className="recipes-count">
                      {recipes.length === 0
                        ? "Start by generating recipes."
                        : `${recipes.length} suggestion${
                            recipes.length > 1 ? "s" : ""
                          } for you`}
                    </span>
                  </div>

                  {recipes.length === 0 && (
                    <div className="empty-state">
                      <Flame className="empty-icon" />
                      <p>
                        No recipes yet. Add your ingredients on the left and click
                        <strong> Generate recipes</strong>.
                      </p>
                    </div>
                  )}

                  <div className="recipes-list">
                    {recipes.map((recipe) => (
                      <article
                        key={recipe.id}
                        className={`recipe-card ${
                          selectedRecipeId === recipe.id ? "recipe-selected" : ""
                        }`}
                        onClick={() => setSelectedRecipeId(recipe.id)}
                      >
                        <div className="recipe-header-row">
                          <h3 className="recipe-title">{recipe.title}</h3>
                          <span className="recipe-time">
                            ⏱ {recipe.approxTimeMins} min
                          </span>
                        </div>
                        <p className="recipe-desc">{recipe.description}</p>

                        {recipe.nutrition && (
                          <div className="recipe-nutrition">
                            <div>
                              <span className="nutri-label">Calories</span>
                              <span className="nutri-value">
                                {recipe.nutrition.calories} kcal
                              </span>
                            </div>
                            <div>
                              <span className="nutri-label">Protein</span>
                              <span className="nutri-value">
                                {recipe.nutrition.protein_g} g
                              </span>
                            </div>
                            <div>
                              <span className="nutri-label">Carbs</span>
                              <span className="nutri-value">
                                {recipe.nutrition.carbs_g} g
                              </span>
                            </div>
                            <div>
                              <span className="nutri-label">Fat</span>
                              <span className="nutri-value">
                                {recipe.nutrition.fat_g} g
                              </span>
                            </div>
                          </div>
                        )}

                        {recipe.nutrition?.tags?.length > 0 && (
                          <div className="tags-row">
                            {recipe.nutrition.tags.map((tag) => (
                              <span key={tag} className="pill tiny-pill">
                                {tag.replaceAll("_", " ")}
                              </span>
                            ))}
                          </div>
                        )}

                        <details
                          className="steps-details"
                          open={recipe.id === selectedRecipeId}
                        >
                          <summary>Steps</summary>
                          <ol className="steps-list">
                            {recipe.steps?.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </details>

                        <button
                          className="primary-btn secondary-btn"
                          style={{ marginTop: 8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveRecipe(recipe);
                          }}
                        >
                          ⭐ Save recipe
                        </button>
                      </article>
                    ))}
                  </div>
                </motion.div>
              </section>
            </>
          )}

          {/* ---------- SAVED TAB ---------- */}
          {activeTab === "saved" && (
            <section
              className="left-column"
              style={{ gridColumn: "1 / -1", gap: 12 }}
            >
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="card-title">Saved recipes ⭐</h2>
                <p className="card-helper">
                  These are recipes you marked as favourites. You can remove them
                  or use them as inspiration anytime.
                </p>

                {savedRecipes.length === 0 && (
                  <div className="empty-state">
                    <Bookmark className="empty-icon" />
                    <p>
                      You haven&apos;t saved anything yet. On the Home tab, click
                      <strong> ⭐ Save recipe</strong> on any suggestion.
                    </p>
                  </div>
                )}

                <div className="recipes-list">
                  {savedRecipes.map((recipe, index) => (
                    <article key={index} className="recipe-card">
                      <div className="recipe-header-row">
                        <h3 className="recipe-title">{recipe.title}</h3>
                        <span className="recipe-time">
                          ⏱ {recipe.approxTimeMins} min
                        </span>
                      </div>
                      <p className="recipe-desc">{recipe.description}</p>

                      {recipe.nutrition && (
                        <div className="recipe-nutrition">
                          <div>
                            <span className="nutri-label">Calories</span>
                            <span className="nutri-value">
                              {recipe.nutrition.calories} kcal
                            </span>
                          </div>
                          <div>
                            <span className="nutri-label">Protein</span>
                            <span className="nutri-value">
                              {recipe.nutrition.protein_g} g
                            </span>
                          </div>
                          <div>
                            <span className="nutri-label">Carbs</span>
                            <span className="nutri-value">
                              {recipe.nutrition.carbs_g} g
                            </span>
                          </div>
                          <div>
                            <span className="nutri-label">Fat</span>
                            <span className="nutri-value">
                              {recipe.nutrition.fat_g} g
                            </span>
                          </div>
                        </div>
                      )}

                      <details className="steps-details">
                        <summary>Steps</summary>
                        <ol className="steps-list">
                          {recipe.steps?.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </details>

                      <button
                        className="primary-btn secondary-btn"
                        style={{ marginTop: 8 }}
                        onClick={() => handleUnsaveRecipe(index)}
                      >
                        Remove from saved
                      </button>
                    </article>
                  ))}
                </div>
              </motion.div>
            </section>
          )}

          {/* ---------- PROFILE TAB ---------- */}
          {activeTab === "profile" && (
            <section
              className="left-column"
              style={{ gridColumn: "1 / -1", gap: 12 }}
            >
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="card-title">Your food profile</h2>
                <p className="card-helper">
                  I&apos;ll use this to make recipes and tips a little more personalised
                  for you.
                </p>

                <div className="options-row" style={{ marginTop: 8 }}>
                  <div className="field">
                    <label>Diet type</label>
                    <select
                      value={profile.diet}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProfile((prev) => ({ ...prev, diet: value }));
                        setDiet(value);
                      }}
                    >
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="non_veg">Non-veg</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Health goal</label>
                    <select
                      value={profile.goal}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProfile((prev) => ({ ...prev, goal: value }));
                        setGoal(value);
                      }}
                    >
                      <option value="pcos_friendly">PCOS-friendly</option>
                      <option value="weight_loss">Weight management</option>
                      <option value="high_protein">High protein</option>
                      <option value="balanced">Balanced</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label className="field-label">Allergies / avoid</label>
                  <textarea
                    className="ingredients-input"
                    rows={2}
                    placeholder="Example: peanuts, milk, very spicy food..."
                    value={profile.allergies}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        allergies: e.target.value,
                      }))
                    }
                  />
                </div>

                <p className="tiny-note" style={{ marginTop: 10 }}>
                  This profile is stored only in your browser (localStorage) and used
                  to pre-fill your goal and diet when generating recipes.
                </p>
              </motion.div>
            </section>
          )}
        </main>

        <footer className="app-footer">
          <p>
            Built with React + Node. Nutrition info is approximate and for
            learning only, not medical advice.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
