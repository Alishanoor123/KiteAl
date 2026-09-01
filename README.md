# KiteAI 🪁
> **A Mindful, AI-Powered Journaling & Self-Reflection Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-7A71B9.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript-BD9DDA.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-F2C76E.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-7A71B9.svg)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/AI-Gemini%203.7%20Flash-E56786.svg)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20Auth%20%26%20Firestore-F2C76E.svg)](https://firebase.google.com/)

---

## 🌟 Executive Summary & Core Value Proposition

In a world filled with continuous digital noise and fast-paced demands, **KiteAI** acts as a calm, contemplative digital sanctuary. It combines expressive personal writing with non-judgmental, structured AI guidance to turn raw thoughts into meaningful self-awareness.

Unlike standard note-taking apps or aggressive goal-trackers, KiteAI emphasizes **cognitive reframing and mindful reflection**. Powered by Google's **Gemini 3.7 Flash** model, KiteAI gently distills emotional entries, highlights underlying patterns, asks illuminating questions, and provides empathetic feedback tailored to your chosen inquiry lens.

### 💡 Core Value Drivers:
- **Calm, Distraction-Free Space**: A clean, highly readable interface designed to lower cognitive friction during journaling.
- **Multidimensional Inquiry Lenses**: Examine your thoughts through Socratic questioning, Stoic fortitude, Mindful presence, or Analytical breakdown.
- **Privacy-First Server Proxying**: Keeps all API credentials safe on the backend without leaking keys to client-side code.
- **Seamless Cloud & Guest Experience**: Try the app instantly in Guest Mode or authenticate securely via Firebase to store reflections across devices.

---

## 🚀 Key Feature Breakdown

### 📝 1. Mindful Journal Editor
- **Distraction-Free Canvas**: Clean typography, word counting, and customizable editor settings.
- **Inquiry Lens Selector**: Choose how KiteAI approaches your thoughts:
  - 🌿 *Mindful Listener*: Empathetic, warm validation without advice-giving.
  - 🤔 *Socratic Guide*: Asks gentle probing questions to examine assumptions.
  - 🏛️ *Stoic Philosopher*: Brings calm, resilient perspective grounded in agency.
  - 📊 *Analytical Breakdown*: Extracts core themes, actionables, and key signals.
- **Thread Management**: Copy full conversations, export entries to Markdown format, or soft-delete entries cleanly.

### 🤖 2. Gemini AI Reflection Engine
- **Powered by `gemini-3.7-flash`**: Delivers instant, nuanced contextual reflections.
- **Server-Side API Proxying**: API calls route through a secure Node.js Express backend (`server.ts`) to ensure secret key protection.
- **Structured Prompts & Grounding**: AI responses avoid clinical diagnosis while maintaining deep, supportive psychological safety.

### 📊 3. Mood Tracking & Mood Badges
- **Contextual Mood Tagging**: Select your emotional state before or after journaling (*Focused*, *Reflective*, *Anxious*, *Creative*, *Calm*, *Gratitude*, *Overwhelmed*, *Energized*).
- **Color-Coded Badges**: Instant visual identification of mood trends across your journal timeline.
- **Filterable Timeline**: Search and sort reflections by keyword, mood tag, or inquiry mode.

### 🔒 4. Secure Authentication & Firebase Integration
- **Google & Federated Identity**: One-click authentication powered by Firebase Auth.
- **Cloud Firestore Persistence**: Real-time synchronization of reflections, mood tags, and thread metadata with owner-bound access control.
- **Guest Mode Support**: Explore features without initial sign-in; seamlessly transition data upon logging in.

---

## 🛠️ Full Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 & TypeScript | Component-based, strongly-typed UI architecture |
| **Build Tool & HMR** | Vite | Lightning-fast module bundler and dev server |
| **Styling & Design** | Tailwind CSS | Utility-first CSS with custom color system & responsive layouts |
| **Icons & Animations** | Lucide React & Motion | Accessible vector icons and smooth layout micro-interactions |
| **Backend Framework** | Node.js & Express (`server.ts`) | Lightweight API server proxying Gemini requests |
| **AI SDK** | `@google/genai` | Official Google GenAI SDK for server-side Gemini invocation |
| **Database** | Firebase Cloud Firestore | NoSQL real-time document store for user reflections |
| **Authentication** | Firebase Auth | Secure identity management (Google Sign-In & Anonymous Auth) |

---

## 🎨 Color Palette

KiteAI uses a calm, organic color palette crafted to reduce eye strain and promote focus:

```
┌─────────────────────────────────────────────────────────┐
│ #EBE7E7  • Off-White Canvas (Light Background)           │
│ #7A71B9  • Deep Periwinkle (Primary Accent & Highlights) │
│ #BD9DDA  • Soft Lavender (Subtle Borders & Highlights)  │
│ #F2C76E  • Warm Mustard (Mood Accents & Focus States)   │
│ #E56786  • Coral Rose (Alerts & Critical Actions)       │
└─────────────────────────────────────────────────────────┘
```

- **Off-White Canvas (`#EBE7E7`)**: Base background color for soft contrast.
- **Deep Periwinkle (`#7A71B9`)**: Primary brand shade for key buttons, headings, and active indicators.
- **Soft Lavender (`#BD9DDA`)**: Soft tint for secondary borders, badges, and active state highlights.
- **Warm Mustard (`#F2C76E`)**: Warm accent for mood badges and highlights.
- **Coral Rose (`#E56786`)**: Vibrant shade for warnings, deletions, and creative callouts.

---

## 🔑 Environment Variables Guide

To run KiteAI locally or deploy it to a server environment, create a `.env` file in the project root containing your API credentials:

```env
# Google Gemini API Key (Server-side secret, NEVER expose VITE_ prefix for this)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (Client-side configuration)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ **Security Note**: Never commit your actual `.env` file to version control. Keep `.env` listed inside your `.gitignore` file.

---

## 💻 Local Setup & Running Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** (v9+) or **bun** (v1+)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/Alishanoor123/KiteAl.git
cd KiteAl
```

### 2. Install Dependencies
Using **npm**:
```bash
npm install
```
*Or using **bun**:*
```bash
bun install
```

### 3. Configure Environment Variables
Copy `.env.example` (or create `.env`) and add your credentials:
```bash
cp .env.example .env
```

### 4. Run the Development Server
```bash
npm run dev
```
*Or using **bun**:*
```bash
bun dev
```

Open your browser at `http://localhost:3000` to interact with the live application!

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🔗 Submission Links

- **GitHub Repository**: [https://github.com/Alishanoor123/KiteAl](https://github.com/Alishanoor123/KiteAl)
- **Video Walkthrough**: [Watch Video Walkthrough](https://drive.google.com/file/d/1YdqjJJ3INaNhxkcR-NP5yF4brdmeXFMe/view?usp=sharing)

---

<p align="center">
  Crafted with care for mindful self-reflection • Powered by <b>Google Gemini API</b> & <b>Firebase</b>
</p>
