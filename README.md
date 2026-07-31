# SpeakX AI · GD-IMPROVEMENT-APP

An AI-powered **English speaking, group-discussion, debate, interview and public-speaking coach**.
You pick a mode, choose a topic and a timer, then speak. SpeakX AI listens silently,
transcribes your speech in the browser, and produces a full **coaching report** with
scores, grammar analysis, fluency metrics, structure breakdown, personalized drills,
progress tracking and gamification.

Built with **React + Vite + TypeScript**. Runs entirely in the browser — no backend, no
account, no data leaves your device.

---

## ✨ Features

- **5 practice modes** — Random Topic, Group Discussion, Debate, Interview, Storytelling.
- **4 difficulty levels** — Beginner → Intermediate → Advanced → Expert (scoring gets stricter).
- **Unlimited topics** across 15+ categories (Technology, Ethics, Economics, Psychology, …).
- **Speaking timer** with the exact durations requested (30s / 45s / 1m / 2m / 3m / 5m / 10m),
  live countdown, and a **10-second "wrap up" warning**.
- **Live speech capture** via the browser Web Speech API (best in Chrome/Edge), with an
  editable transcript and a type/paste fallback for unsupported browsers.
- **Full coaching report** covering all 14 areas from the spec:
  1. Overall score + 13 sub-scores (radar chart)
  2. Detailed feedback (strengths / weaknesses / hesitation)
  3. Grammar analysis (original → correction → rule → explanation)
  4. Vocabulary analysis (diversity, overused words, weak-word upgrades, power words)
  5. Pronunciation hints (clearly labeled as *estimated from text*)
  6. Fluency (WPM, filler-word breakdown, estimated pauses)
  7. Structure (intro / body / arguments / examples / counter-arguments / conclusion)
  8. Critical thinking & debate analysis (logic gaps, missing counterpoints)
  9. Pressure handling & fear-signal detection
  10. Emotional delivery (energy, enthusiasm, professionalism, friendliness)
  11. Interview readiness (Big Tech / Government / MBA / Public Speaking)
  12. Debate analysis
  13. Personalized coaching drills + daily/weekly/monthly goals + fear techniques
  14. Auto-generated "next challenge" topic targeting your weakest area
- **Progress dashboard** — trend charts per metric, best/worst/average, improvement %,
  and full session history.
- **Gamification** — XP, levels, daily streaks, and 11 unlockable badges
  (Grammar Master, Vocabulary Ninja, Debate Champion, Interview Ready, …).
- **Optional AI enhancement** — add your own OpenAI key in Settings for richer,
  context-aware written feedback. The app is fully functional without it.

---

## 🚀 Getting started

Requires **Node.js 18+** (built and tested on Node 22).

```bash
npm install
npm run dev      # start the dev server (opens http://localhost:5173)
```

Other scripts:

```bash
npm run build    # type-check (tsc -b) + production build to dist/
npm run preview  # preview the production build
npm run lint     # type-check only
```

> **Browser note:** live microphone transcription uses the Web Speech API, which works
> best in **Google Chrome** and **Microsoft Edge**. In other browsers the app falls back
> to a text box where you can type/paste what you said — every analysis feature still works.

---

## 🧠 How the analysis works (and what's honest about it)

The coaching engine (`src/lib/analysis/`) is **deterministic** and runs locally:

- **Measured from the transcript + timer** (real, not guessed): words per minute,
  filler-word counts, vocabulary diversity, repetition, structure markers, and a
  rule-based grammar checker.
- **Estimated / heuristic** (clearly labeled in the UI): pronunciation difficulty and
  "long pause" counts are inferred from the *text* and pacing, **not** from your audio.
  True pronunciation and pause analysis would require processing the raw audio signal.

Enabling the optional OpenAI key adds a qualitative narrative layer on top of these
objective metrics using the SpeakX coaching prompt (`src/lib/llm.ts`).

---

## 🗂️ Project structure

```
src/
  types.ts                 # shared domain types
  App.tsx                  # screen router + app state
  main.tsx                 # React entry point
  index.css                # theme + styles
  hooks/
    useSpeechRecognition.ts# Web Speech API wrapper
  lib/
    topics.ts              # topic + "next challenge" generator
    storage.ts             # localStorage (sessions, gamification, API key)
    gamification.ts        # XP, levels, streaks, badges, insights
    llm.ts                 # optional OpenAI enhancement
    analysis/
      text.ts              # tokenizing, syllables, helpers
      lexicons.ts          # fillers, weak/power words, discourse markers
      grammar.ts           # rule-based grammar checker
      engine.ts            # analyzeSpeech() -> full CoachReport
  components/
    SetupScreen.tsx        # mode / difficulty / topic / timer selection
    SpeakingScreen.tsx     # countdown + live transcript
    ReportView.tsx         # the 14-section coaching report
    Dashboard.tsx          # progress charts + history
    Settings.tsx           # optional API key
    common.tsx             # score bar / ring / section helpers
scripts/
  smoke.ts                 # quick manual test of the engine (npx tsx scripts/smoke.ts)
```

---

## 🔐 Privacy & the optional API key

- All sessions and progress are stored in your browser's **localStorage** only.
- If you add an OpenAI key, it is stored in localStorage and sent **directly** from your
  browser to OpenAI — it is never sent anywhere else. Any key placed in a browser app is
  visible within that browser, so use a rate-limited key and **never commit real keys**.

---

## 🛣️ Possible next steps

- Real audio-based pronunciation & pause detection (Web Audio + a speech model).
- Cloud sync + accounts for cross-device progress.
- Code-splitting the charts to shrink the initial bundle.
