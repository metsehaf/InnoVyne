# AI-Enhanced Data Module

![Screenshot of the application running locally](images/app-screenshot.png)

## Project Overview

This project is a full-stack web application designed to bridge the gap between raw data and actionable insights. Users can upload structured data and interact with it through an AI-driven interface.

**Core Features:**

- **CSV Upload:** Seamlessly ingest local data files.
- **Interactive Data Grid:** View and sort data in a responsive table.
- **AI Insights:** Query, summarize, or analyze the dataset using natural language via integrated LLMs.

**Goal:** Demonstrate proficiency in modern data handling, UI development, and AI integration for technical interview requirements.

---

## System Architecture

The application follows a standard **Client-Server-Database** pattern, with a specialized service layer for handling asynchronous AI requests.

---

## Technologies Used

| Area               | Technology                   | Key Packages                   |
| :----------------- | :--------------------------- | :----------------------------- |
| **Frontend**       | React, TypeScript            | `react`, `react-dom`           |
| **Backend**        | Node.js, Express, TypeScript | `express`, `cors`, `multer`    |
| **Database**       | PostgreSQL, Sequelize        | `pg`, `pg-hstore`, `sequelize` |
| **Data Handling**  | CSV Processing               | `csv-parser`, `uuid`           |
| **AI Integration** | Google Gemini / Hugging Face | `dotenv`, `node-fetch`         |

---

## How to Run Locally

### Prerequisites

- **Node.js** (v18+ recommended)
- **PostgreSQL** (running locally or a hosted instance)
- **API Key** (Choose one):
  - **Google AI (Recommended):** Get an API key from [Google AI Studio](https://aistudio.google.com/).
  - **Hugging Face:** Create an [Access Token](https://huggingface.co/settings/tokens).

---

## Setup Steps

### 1. Clone the Repository

```bash
git clone [https://github.com/metsehaf/InnoVyne.git](https://github.com/metsehaf/InnoVyne.git)
cd InnoVyne
```

### 2. Install Dependencies

Install dependencies for both frontend and backend from the root folder.

```bash
npm install
```

### 3. Configure Environment Variables

Create a .env file in the project root:

Code snippet

# Database Configuration

DATABASE_URL=postgresql://me:your_database_password@localhost:5432/api

# AI Configuration (Choose ONE provider)

# --- Google Gemini (Recommended) ---

AI_PROVIDER=google
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
GOOGLE_MODEL=gemini-3-flash

# --- OR Hugging Face ---

AI_PROVIDER=huggingface
HF_API_KEY=YOUR_HF_TOKEN
HF_MODEL=google/gemma-2-2b-it

### 4. Run Database Migrations

Initialize the database schema using Sequelize:

```bash
npx sequelize-cli db:migrate
```

### 5. Start the Application

Run the development environment:

```bash
npm run start
```

### 6. Access the Application

Open your browser and navigate to: http://localhost:5173 (or the port displayed in your terminal).

Usage Guide
Upload: Select a .csv file via the upload dashboard.

Review: Ensure the data loads correctly in the interactive table.

Analyze: Use the chat sidebar to ask questions like "How many companies have been contacted in deal stage so far?" or "Summarize the trends in this data."
