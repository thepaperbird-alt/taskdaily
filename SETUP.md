# TaskDaily Setup Guide

## Prerequisites
- Node.js 18+
- Supabase Account (Free Tier)
- OpenAI API Key

## Configuration

1. **Environment Variables**
   Create a `.env.local` file in the root directory:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

2. **Database Setup**
   Run the SQL commands in `database.sql` in your Supabase SQL Editor.
   **Crucial:** This script enables Row Level Security (RLS). Ensure you run this to protect user data.

3. **Authentication**
   - Go to Supabase Dashboard > Authentication > Providers.
   - Ensure "Email" provider is enabled.
   - (Optional) Disable "Confirm email" in Auth Settings if you want to test signup without email verification.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Features
- **Tasks**: Create, toggle, delete tasks. Filter by tags.
- **Dailies**: Weekly journal view. Add inline tasks. Auto-save.
- **Tags**: Create and assign tags to tasks and dailies. Global filtering.
- **Summary**: Weekly metrics, AI-generated insights, and Markdown export.

## Deployment
Deploy to Vercel and add the environment variables in the project settings.
