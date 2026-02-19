# Deployment Guide for TaskDaily

Follow these steps to deploy your application to Vercel.

## 1. Push Code to GitHub

Since this is a new repository, you need to create it on GitHub and push your local code.

1.  **Log in to GitHub** and create a new repository named `task-daily` (or similar).
2.  **Do not** initialize it with a README, .gitignore, or license (you already have them).
3.  Copy the commands under **"…or push an existing repository from the command line"**.
4.  Run them in your terminal. They will look like this:

```bash
git remote add origin https://github.com/YOUR_USERNAME/task-daily.git
git branch -M main
git push -u origin main
```

## 2. Deploy to Vercel

1.  **Log in to Vercel** (https://vercel.com).
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub repository (`task-daily`).
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: `./` (default).
    *   **Environment Variables**: You MUST add the following variables from your `.env.local` file:
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `OPENAI_API_KEY`
5.  Click **"Deploy"**.

## 3. Production Configuration

After deployment, ensure your Supabase URL in the environment variables points to your **production Supabase project** if you are separating dev/prod. For this personal app, using the same project is fine, but ensure the **URL and KEY are correct**.

## 4. Verification

Once deployed, Vercel will give you a domain (e.g., `task-daily.vercel.app`). Open it and verify:
*   Login works.
*   Tasks load.
*   Styles are correct.

**Note:** If you see "Application Error" or 500s, check the **Function Logs** in Vercel. It is usually a missing Environment Variable.
