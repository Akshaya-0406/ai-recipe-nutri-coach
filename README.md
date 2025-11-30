AI Recipe & Nutrition Coach 🍽️🤖

Your personal AI-powered kitchen assistant — generate healthy recipes, get PCOS-friendly nutrition tips, and save your favorite meals. Built with React + Node.js + OpenAI.

🚀 Live Demo

👉 Frontend (Netlify): https://ai-nutrition-coach.netlify.app

👉 Backend (Render): https://ai-recipe-nutri-coach.onrender.com

🌟 Features
🍲 AI Recipe Generator

Enter any ingredients you have

Generates 2–4 simple, Indian-style meals

Includes:

Steps

Cooking time

Nutrition breakdown (calories, protein, carbs, fats)

Tags (PCOS-friendly, high-protein, balanced etc.)

🧠 AI Nutrition Coach

Ask questions about:

PCOS-friendly swaps

Weight loss tips

High-protein upgrades

Portion sizes

Snack ideas

AI replies with gentle, goal-aware guidance

Also gives extra tips for your diet goal

⭐ Saved Recipes

Save any recipe you like

Stored in browser localStorage

Easily revisit your favorite meals

👤 Personal Food Profile

Diet type: vegetarian / vegan / non-veg

Health goal: PCOS-friendly / Weight loss / High protein

Allergies & foods to avoid

Automatically used by recipe generator & coach

🎨 Modern UI

Built with React + Framer Motion animations

Lucide icons

Responsive, clean & minimal

Smooth UX with tabs → Home / Saved / Profile

🏗️ Tech Stack
Frontend

React (Vite)

Axios

Lucide React (icons)

Framer Motion (animations)

Backend

Node.js

Express

OpenAI API (Responses + Fallback mode)

CORS enabled for dev & prod

Deployment

Frontend → Netlify

Backend → Render

📦 Folder Structure
ai-recipe-nutri-coach/
│── client/       # React frontend
│── server/       # Node.js backend
│── README.md

🔧 Environment Variables

Create a .env file inside server/:

OPENAI_API_KEY=your_key_here


Do NOT commit .env to GitHub.

🏃‍♂️ Run Locally
Start Backend
cd server
npm install
node index.js

Start Frontend
cd client
npm install
npm run dev


Open http://localhost:5174

🛡️ Notes

Nutrition values are approximate

This app is for learning only, not medical advice

❤️ Author

Built by Akshaya
Feel free to ⭐ the repo if you found it useful!
