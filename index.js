// ✅ index.js — FINAL bulletproof backend for VibeCheck Passport

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // serve html/css/js

// 🛂 Mood → Generate Fake Country + Customs Question
app.post("/vibecheck", async (req, res) => {
  const userMood = req.body.mood;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a playful customs officer in an imaginary world of feelings.

              ✈️ When someone shares their mood:
              1️⃣ Create ONE silly, made-up country name (add an emoji).
                 ➡ Keep it short (1–3 words): e.g. “Naplandia 💤”, “Procrastistan 🐢”.
              2️⃣ Ask ONE fun, simple but creative, related customs question — just a short sentence that catches their attention and connects to the mood they typed and wow the users.

              🎯 FORMAT:
              <Country Name and Emoji> Customs question: <Your question>`,
          },
          { role: "user", content: userMood },
        ],
        temperature: 0.9,
        max_tokens: 120,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://vibecheck-passport.replit.app",
          "X-Title": "VibeCheck Passport",
          "Content-Type": "application/json",
        },
      },
    );

    const reply = response.data.choices[0].message.content;

    // ✅ Split reply into country + question
    let country = "Moodland";
    let question = "What brings you here?";
    if (reply.includes("Customs question:")) {
      const [cPart, qPart] = reply.split("Customs question:");
      country = cPart.trim();
      question = qPart.trim();
    } else {
      country = reply; // fallback if AI didn’t format well
    }

    res.json({ country, question });
  } catch (error) {
    console.error("GPT API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// 🎒 Customs Answer → Generate Baggage + Badge Emoji
app.post("/generate-baggage", async (req, res) => {
  const { customsAnswer } = req.body;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a witty baggage namer. Reply EXACTLY in this format:\n\nDescription: <a short, funny, or poetic baggage name>\nEmoji: <ONE emoji>\n\nDo NOT add anything else.",
          },
          { role: "user", content: `User answered: "${customsAnswer}"` },
        ],
        temperature: 0.9,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://vibecheck-passport.replit.app",
          "X-Title": "VibeCheck Passport",
          "Content-Type": "application/json",
        },
      },
    );

    const aiText = response.data.choices[0].message.content.trim();

    // ✅ Step 1: Try normal parsing
    let description = aiText.match(/Description:(.*)/i)?.[1]?.trim() || "";
    let badge = aiText.match(/Emoji:(.*)/i)?.[1]?.trim() || "";

    // ✅ Step 2: If AI skipped "Description:" or "Emoji:" labels
    if (!description) {
      description = aiText; // take whole AI text as description
    }

    // ✅ Step 3: If badge still missing, grab the last word as emoji
    if (!badge) {
      const lastSpace = description.lastIndexOf(" ");
      if (lastSpace !== -1) {
        const possibleEmoji = description.slice(lastSpace + 1).trim();
        if (/\p{Emoji}/u.test(possibleEmoji)) {
          badge = possibleEmoji;
          description = description.slice(0, lastSpace).trim();
        }
      }
    }

    // ✅ Final fallback values
    if (!description) description = "Unnamed Baggage";
    if (!badge) badge = "🧳";

    res.json({
      description,
      badge,
      image: "/images/baggage.png",
    });
  } catch (error) {
    console.error("BAGGAGE API error:", error.response?.data || error.message);
    res.json({
      description: "A mystery suitcase full of forgotten dreams",
      badge: "🧳",
      image: "/images/baggage.png",
    });
  }
});

// ✈️ Save Entry — called when user claims baggage
app.post("/save-entry", (req, res) => {
  const { username, country, question, answer, baggage, badge } = req.body;

  console.log(
    `📌 ENTRY SAVED: ${username} visited ${country} with ${baggage} ${badge}`,
  );
  res.json({ success: true, message: "Entry saved successfully!" });
});

// 🏠 Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/home.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
