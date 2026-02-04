# DevCompass

DevCompass is a developer analytical dashboard that aggregates and visualizes competitive programming and coding statistics from **GitHub**, **Codeforces**, and **LeetCode**.

It solves the problem of scattered developer profiles by unifying them into a single, beautiful dashboard with automated analysis, weakness detection, and progress tracking.

---

## 🚀 Tech Stack

- **Framework**: SvelteKit
- **Authentication**: BetterAuth (GitHub OAuth)
- **Database**: PostgreSQL (via Drizzle ORM)
- **Caching**: Redis (Upstash)
- **Styling**: TailwindCSS
- **Deployment**: Docker / Vercel (compatible)

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+) or Bun (v1.0+)
- PostgreSQL database
- Redis instance (Upstash recommended)
- GitHub OAuth credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/dhruvkdev/Dev-Compass.git
   cd Dev-Compass
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment**
   Create a `.env` file based on `.env.example`:

   ```env
   # Database
   DATABASE_URL="postgres://..."

   # Auth
   BETTER_AUTH_SECRET="your-secret"
   GITHUB_CLIENT_ID="your-id"
   GITHUB_CLIENT_SECRET="your-secret"

   # Redis
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="your-token"
   ```

4. **Initialize Database**

   ```bash
   bun run db:push
   ```

5. **Start Development Server**
   ```bash
   bun run dev
   ```

---

## 📚 Documentation

Detailed internal documentation is available in the [`docs/`](./docs) directory:

- [**System Architecture**](./docs/architecture.md) - High-level design and components
- [**Verification Flows**](./docs/flows/verification.md) - How we verify platform ownership
- [**Caching Strategy**](./docs/caching.md) - Redis implementation details
- [**Dashboard Data Flow**](./docs/flows/dashboard.md) - How analytics are fetched and displayed
