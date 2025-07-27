// ✅ script.js — Clean version for VibeCheck Passport
// Only keeps what we need & removes unused mood-based styling

const moodInput = document.getElementById("mood");
const vibeResponse = document.getElementById("vibe-response");
const userName = localStorage.getItem("username") || "Guest";

if (vibeResponse) vibeResponse.style.display = "none";

/**
 * 🛂 Mood → generate country + customs question
 */
async function submitMood() {
  const mood = moodInput.value.trim();
  if (!mood) {
    vibeResponse.innerText = "⚠️ Please enter how you're feeling 🌧️";
    vibeResponse.style.display = "block";
    return;
  }

  vibeResponse.innerText = "🛂 Stamping your passport...";
  vibeResponse.style.display = "block";

  try {
    const res = await fetch("/vibecheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood }),
    });

    const data = await res.json();

    if (data.country && data.question) {
      // Save the reply neatly (country + question)
      localStorage.setItem(
        "lastReply",
        `${data.country} Customs question: ${data.question}`
      );
      window.location.href = "customs.html";
    } else {
      vibeResponse.innerText = "❌ No vibe detected. Try again!";
    }
  } catch (err) {
    console.error(err);
    vibeResponse.innerText = "💥 Something went wrong. Try again!";
  }
}

/**
 * 🎒 Call AI to generate baggage (optional, future use)
 */
async function generateBaggageFromAI(answer) {
  try {
    const res = await fetch("/generate-baggage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customsAnswer: answer }),
    });

    const data = await res.json();
    return {
      description: data.description || "A mysterious suitcase of emotions 🧳",
      badge: data.badge || "🧳",
      gifURL: data.gifURL || "",
    };
  } catch (err) {
    console.error("AI baggage generation failed", err);
    return {
      description: "A mystery bag with unknown vibes 🧳❓",
      badge: "🧳",
      gifURL: "",
    };
  }
}

/**
 * 📦 Save entry to passport (localStorage)
 * Called in customs.html when badge is claimed
 */
function saveEntry(entry) {
  let journey = JSON.parse(
    localStorage.getItem(`passport-${userName}`) || "[]"
  );
  journey.push(entry);
  localStorage.setItem(`passport-${userName}`, JSON.stringify(journey));
}

/**
 * 📖 Navigate to passport page
 */
function viewPassport() {
  window.location.href = "passport.html";
}
