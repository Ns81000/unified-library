<p align="center">
  <img src="https://img.shields.io/badge/Unified-Library-8A2BE2?style=for-the-badge&logo=bookstack&logoColor=white" alt="Unified Library" />
</p>

<h1 align="center">📚 Unified Library</h1>

<p align="center">
  <strong>Your AI-Powered Personal Media Collection Manager</strong>
</p>

<p align="center">
  <em>Organize movies, anime, books, games, manga, and more with intelligent AI-powered search, auto-enrichment, and beautiful analytics.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2.15-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-5.20-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Google_Gemini-2.5-8E75B2?style=flat-square&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector_DB-FF6F61?style=flat-square&logo=databricks&logoColor=white" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-docker-deployment">Docker</a> •
  <a href="#-usage-guide">Usage</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

## 🌟 Introduction

**Unified Library** is a modern, AI-enhanced media collection manager designed to help you catalog and explore your entertainment library like never before. Whether you're tracking movies, anime series, books, games, manga, or any other media type, Unified Library provides intelligent tools to organize, discover, and analyze your collection.

Built with cutting-edge web technologies and powered by **Google Gemini AI**, this application offers:

- **Smart Auto-Fill**: Enter a title and let AI research and populate all the details
- **Semantic Search**: Find items using natural language queries like *"a sci-fi movie with time travel"*
- **AI Recommendations**: Get personalized suggestions based on your mood or preferences
- **Comprehensive Analytics**: Beautiful dashboards with insights about your collection

---

## ✨ Key Features

### 🤖 AI-Powered Smart Autofill
Enter just a title and media type, and Gemini 2.5 Flash will:
- Search the web for accurate, up-to-date information
- Generate detailed synopses and metadata
- Extract relevant keywords for search optimization
- Find and download high-quality cover images
- Auto-categorize with type-specific metadata fields

### 🔍 Semantic AI Search
Powered by **ChromaDB** vector database and **Ollama embeddings**:
- Search using natural language descriptions (*"something uplifting with a strong female lead"*)
- Get AI-generated explanations for why each result matches your query
- Relevance scoring with smart filtering (only highly relevant results)
- Works across all your media types simultaneously

### 🎲 AI Random Picker ("What's Next?")
Can't decide what to watch/read/play next? Let AI help:
- Enter a mood or leave blank for true randomness
- Get an AI-generated pitch explaining why you should check out the recommendation
- Semantic matching to find items that fit your current vibe

### 📊 Advanced Analytics Dashboard
Comprehensive statistics and visualizations including:
- **Library Overview**: Total items, quality scores, type distribution
- **Keyword Analytics**: Top keywords, co-occurrence networks, orphan detection
- **Timeline Analysis**: Monthly/yearly trends, recent additions, oldest items
- **Metadata Deep Dive**: Type-specific analytics (genres, directors, studios, etc.)
- **Data Health Reports**: Missing covers, keywords, and metadata alerts
- **AI Insights**: Personalized observations and recommendations powered by Gemini

### 📦 Bulk Import System
Import hundreds of items at once with a powerful 3-step workflow:
1. **Context Extraction**: Parse bookmarks/lists with AI
2. **Deep Research**: Use Gemini Advanced for comprehensive data gathering
3. **JSON Import**: Paste and import with automatic image downloading

### 💾 Backup & Restore
Full database backup and restore functionality:
- Export entire library to JSON
- Restore from backup with embedding regeneration
- Preserve all metadata and relationships

### 🎨 Modern UI/UX
Built with **Shadcn/UI** components for a beautiful, accessible interface:
- Responsive grid layouts for all screen sizes
- Dark/light mode support via Tailwind CSS
- Toast notifications for feedback
- Modal dialogs for detailed item views
- Smooth animations and transitions

---

## 🛠 Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | [Next.js 14.2.15](https://nextjs.org/) | React framework with App Router |
| **Language** | [TypeScript 5.6](https://www.typescriptlang.org/) | Type-safe development |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Utility-first CSS framework |
| **UI Components** | [Shadcn/UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | Accessible component library |
| **Database** | [PostgreSQL 16](https://www.postgresql.org/) | Relational database |
| **ORM** | [Prisma 5.20](https://www.prisma.io/) | Type-safe database client |
| **Vector DB** | [ChromaDB](https://www.trychroma.com/) | Embedding storage for semantic search |
| **AI/LLM** | [Google Gemini 2.5 Flash](https://ai.google.dev/) | Data enrichment & chat |
| **Embeddings** | [Ollama](https://ollama.com/) + embeddinggemma | Local vector embeddings |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) | WebP conversion & optimization |
| **Charts** | [Recharts](https://recharts.org/) | Data visualization |
| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful SVG icons |
| **Container** | [Docker](https://www.docker.com/) | Containerized deployment |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** (or Docker)
- **pnpm** (recommended) or npm
- **PostgreSQL 16** (or use Docker)
- **Ollama** (for local embeddings)
- **Google Gemini API Key** ([Get one free](https://ai.google.dev/))

### Option 1: Standard Installation (Node.js)

#### 1. Clone the Repository

```bash
git clone https://github.com/Ns81000/unified-library.git
cd unified-library
```

#### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

#### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://mediauser:mediapass@localhost:5432/media_library?schema=public"

# Google Gemini API (Required for AI features)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key-here"

# ChromaDB (Vector Database)
CHROMADB_URL="http://localhost:8000"

# Ollama (Local Embeddings)
OLLAMA_URL="http://localhost:11434"
OLLAMA_EMBEDDING_MODEL="embeddinggemma:300m"
```

#### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate deploy

# (Optional) Open Prisma Studio to view data
pnpm prisma studio
```

#### 5. Start Required Services

**PostgreSQL** (if not using Docker):
```bash
# macOS (Homebrew)
brew services start postgresql@16

# Ubuntu/Debian
sudo systemctl start postgresql
```

**ChromaDB**:
```bash
docker run -d -p 8000:8000 chromadb/chroma:latest
```

**Ollama** (for embeddings):
```bash
# Install from https://ollama.com/download
ollama serve

# In another terminal, pull the embedding model
ollama pull embeddinggemma:300m
```

#### 6. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option 2: Docker Deployment 🐳

Docker is the **recommended** way to deploy Unified Library in production.

#### 1. Clone and Configure

```bash
git clone https://github.com/Ns81000/unified-library.git
cd unified-library
```

Create a `.env` file with your Gemini API key:

```env
GOOGLE_GEMINI_API_KEY="your-gemini-api-key-here"
```

#### 2. Install Ollama on Host

Ollama runs on your **host machine** (not in Docker) for optimal performance:

```bash
# Download from https://ollama.com/download
# Then pull the embedding model:
ollama pull embeddinggemma:300m

# Start Ollama service
ollama serve
```

#### 3. Run with Docker Compose

**Windows (PowerShell):**
```powershell
# Use the automated setup script
.\setup.ps1
```

**Manual Docker Compose:**
```bash
# Build and start all services
docker-compose up -d --build

# Wait for PostgreSQL to be healthy, then run migrations
docker-compose exec next-app pnpm prisma migrate deploy

# View logs
docker-compose logs -f
```

#### 4. Access the Application

Open [http://localhost:3000](http://localhost:3000)

#### Docker Services Overview

| Service | Port | Description |
|---------|------|-------------|
| `next-app` | 3000 | Next.js application |
| `postgres` | 5432 | PostgreSQL database |
| `chromadb` | 8000 | ChromaDB vector database |

#### Docker Commands

```bash
# Stop all services
docker-compose down

# Restart the app
docker-compose restart next-app

# Rebuild after code changes
docker-compose up --build -d

# View logs
docker-compose logs -f next-app

# Access PostgreSQL
docker-compose exec postgres psql -U mediauser -d media_library
```

---

## 📖 Usage Guide

### Adding Items with Smart Autofill

1. Click **"Add New Item"** in the header
2. Enter the **title** (e.g., "Inception")
3. Select the **type** (e.g., "MOVIE")
4. Click **"Auto-fill with AI"**
5. Review and edit the AI-generated data
6. Click **"Save to Library"**

The AI will automatically:
- Research the item using web search
- Generate a detailed synopsis
- Extract 10-15 relevant keywords
- Find a high-quality cover image
- Populate type-specific metadata

### Using the Random Picker

1. Click **"What's Next?"** in the header
2. Optionally enter a mood/preference:
   - *"something relaxing"*
   - *"action-packed adventure"*
   - *"mind-bending thriller"*
3. Leave blank for truly random selection
4. Click **"Pick Something"**
5. Read the AI's pitch and click **"View Details"**

### Semantic AI Search

1. Use the **AI search bar** (below the quick search)
2. Enter natural language queries:
   - *"a sci-fi movie with time travel"*
   - *"dark fantasy anime with complex characters"*
   - *"cozy book for a rainy day"*
3. Click **"Enhance"** to let AI optimize your query (optional)
4. Click **"AI Search"** to find matching items
5. Each result includes an AI explanation of why it matched

### Bulk Import Workflow

For importing large collections:

1. Navigate to **Bulk Import** from the header
2. Click **"View All Prompts"** to see the 3-step process
3. **Step 1**: Extract titles from your bookmarks using Prompt 1
4. **Step 2**: Deep research with Gemini Advanced Notebook
5. **Step 3**: Generate clean JSON with Prompt 3
6. Paste the JSON array and click **"Run Import"**

### Viewing Statistics

1. Click **"Statistics"** in the header
2. Explore tabs:
   - **Overview**: Library totals and quality scores
   - **Keywords**: Tag analytics and co-occurrence
   - **Timeline**: Temporal trends
   - **By Type**: Detailed metadata analysis per type
   - **AI Insights**: Personalized observations

---

## 📁 Project Structure

```
unified-library/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main library view
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles
│   ├── api/                      # API Routes
│   │   ├── autofill/             # AI data enrichment
│   │   ├── backup/               # Export library to JSON
│   │   ├── bulk-import/          # Batch import items
│   │   ├── enhance-query/        # Query optimization
│   │   ├── items/                # CRUD operations
│   │   │   ├── route.ts          # GET/POST items
│   │   │   ├── [id]/             # Individual item operations
│   │   │   ├── update-image/     # Image updates
│   │   │   └── upload-image/     # Image uploads
│   │   ├── random/               # AI random picker
│   │   ├── restore/              # Restore from backup
│   │   ├── search/               # Semantic search
│   │   └── stats/                # Analytics data
│   │       ├── route.ts          # Statistics calculations
│   │       └── ai-insights/      # AI-generated insights
│   ├── backup/                   # Backup/restore page
│   ├── bulk-import/              # Bulk import page
│   │   └── prompts/              # Import prompt templates
│   └── stats/                    # Statistics dashboard
├── components/                   # React Components
│   ├── AddItemModal.tsx          # Add new item dialog
│   ├── ItemCard.tsx              # Library grid item
│   ├── ItemModal.tsx             # Item detail view
│   ├── RandomPickerModal.tsx     # Random recommendation
│   └── ui/                       # Shadcn/UI components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
├── lib/                          # Utility Libraries
│   ├── chromadb.ts               # Vector database client
│   ├── gemini.ts                 # Google AI integration
│   ├── prisma.ts                 # Database client
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database Schema
│   ├── schema.prisma             # Prisma schema definition
│   └── migrations/               # Database migrations
├── media-storage/                # Local Image Storage
│   └── covers/                   # Cover images (WebP)
├── public/                       # Static Assets
├── docker-compose.yml            # Docker services config
├── Dockerfile                    # Next.js container build
├── server.js                     # Custom server for media
├── setup.ps1                     # Windows setup script
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## 🗄 Database Schema

The application uses a flexible schema supporting **17 media types**:

```prisma
enum ItemType {
  MOVIE      SERIES     ANIME      BOOK
  GAME       COMIC      MANGA      PERSON
  FRANCHISE  PORNSTAR   DONGHUA    MANHWA
  MANHUA     HENTAI     AENI       ANIMATION
  WEBTOON
}

model Item {
  id          String    @id @default(uuid())
  title       String
  type        ItemType
  coverImage  String?   // Local WebP path
  synopsis    String    @db.Text
  keywords    String[]  // For embedding & search
  notes       String?   @db.Text
  metadata    Json      // Type-specific fields
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Metadata Structure by Type:**

| Type | Metadata Fields |
|------|-----------------|
| MOVIE/SERIES | `releaseYear`, `director`, `mainActors[]`, `genres[]`, `studio` |
| ANIME/DONGHUA/AENI | `releaseYear`, `studio`, `director`, `genres[]`, `episodes` |
| BOOK | `author`, `publicationYear`, `pages`, `genres[]`, `publisher` |
| MANGA/MANHWA/MANHUA/WEBTOON | `author`, `artist`, `publicationYear`, `genres[]`, `publisher` |
| GAME | `developer`, `publisher`, `platforms[]`, `releaseYear`, `genres[]` |
| PERSON | `knownFor`, `birthYear`, `notableWorks[]` |
| FRANCHISE | `creator`, `mediaTypes[]` |

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GOOGLE_GEMINI_API_KEY` | ✅ | Gemini API key for AI features |
| `CHROMADB_URL` | ✅ | ChromaDB server URL |
| `OLLAMA_URL` | ⚠️ | Ollama server URL (default: localhost:11434) |
| `OLLAMA_EMBEDDING_MODEL` | ⚠️ | Embedding model (default: embeddinggemma:300m) |

### AI Models Used

| Feature | Model | Purpose |
|---------|-------|---------|
| Smart Autofill | Gemini 2.5 Flash | Web search & data enrichment |
| Search Explanations | Gemini 2.5 Flash Lite | Quick explanations |
| AI Insights | Gemini 2.5 Flash Lite | Statistics analysis |
| Embeddings | Ollama embeddinggemma:300m | Local vector generation |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Unified Media Library Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS
- [Shadcn/UI](https://ui.shadcn.com/) - Beautiful Components
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Google Gemini](https://ai.google.dev/) - AI Intelligence
- [ChromaDB](https://www.trychroma.com/) - Vector Database
- [Ollama](https://ollama.com/) - Local AI Models

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Ns81000">Ns81000</a>
</p>

<p align="center">
  <a href="https://github.com/Ns81000/unified-library/issues">Report Bug</a> •
  <a href="https://github.com/Ns81000/unified-library/issues">Request Feature</a>
</p>
