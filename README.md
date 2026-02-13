# Next.js + Sanity CMS

A Next.js 14 application with embedded Sanity Studio. The frontend runs at `/` and Sanity Studio at `/studio`.

## Quick Start

```bash
npm install
npm run dev
```

Then open:

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Sanity Studio:** [http://localhost:3000/studio](http://localhost:3000/studio)

On first run, `.env.local` is created from `.env.local.example` if it doesn't exist. The project uses:

- **Project ID:** `rbvc65h6`
- **Dataset:** `production`

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (/)
│   ├── studio/
│   │   └── [[...index]]/
│   │       └── page.tsx    # Sanity Studio (/studio)
│   └── posts/
│       └── [slug]/
│           └── page.tsx    # Post detail pages
├── sanity/
│   ├── schemas/
│   │   ├── index.ts
│   │   └── post.ts         # Post schema (title, slug, body)
│   └── lib/
│       ├── client.ts       # Sanity client
│       └── queries.ts     # GROQ queries
├── sanity.config.ts       # Sanity Studio config
├── netlify.toml           # Netlify deployment config
└── package.json
```

## Deploy to Netlify

### 1. Push to Git

Push this project to GitHub, GitLab, or Bitbucket.

### 2. Connect to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your Git provider and select this repository
4. Netlify will auto-detect Next.js. Use these settings:
   - **Build command:** `npm run build` (default)
   - **Publish directory:** (leave default; Netlify handles Next.js)
   - **Base directory:** (leave empty)

### 3. Environment Variables

In **Site settings** → **Environment variables**, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `rbvc65h6` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |

### 4. Sanity CORS

Add your Netlify URL to Sanity CORS origins:

1. Go to [sanity.io/manage](https://www.sanity.io/manage)
2. Select project `rbvc65h6`
3. **API** → **CORS origins** → **Add CORS origin**
4. Add `https://your-site.netlify.app` (and `https://*.netlify.app` for preview deploys)
5. Enable **Allow credentials**

### 5. Deploy

Trigger a deploy (or push a commit). After deployment:

- **Frontend:** `https://your-site.netlify.app/`
- **Studio:** `https://your-site.netlify.app/studio`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (frontend + Studio) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Sanity CMS** (embedded Studio)
- **next-sanity** (client, Studio embedding)
