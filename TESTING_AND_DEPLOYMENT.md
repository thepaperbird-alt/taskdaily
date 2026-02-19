# TaskDaily Testing & Deployment Guide

## PART 1: Local Testing

### 1. Prerequisites
Ensure you have the following ready:
- **Node.js**: Installed on your machine.
- **Supabase Project URL & Anon Key**: From your Supabase dashboard (Project Settings > API).
- **OpenAI API Key**: (Optional if you don't need AI summaries immediately).

### 2. Setup Configuration
1. Create a file named `.env.local` in the root folder of the project.
2. Paste the following content into it:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

### 3. Run the Database Setup
1. Go to your **Supabase Dashboard** > **SQL Editor**.
2. Copy the entire content of the `database.sql` file from this project.
3. Paste it into the SQL Editor and click **Run**.
   - *This creates the `tasks`, `dailies`, `tags`, and other necessary tables.*

### 4. Start the App
Open your terminal (Command Prompt or Terminal) in the project folder and run:

```bash
npm install
npm run dev
```

Open your browser to: [http://localhost:3000](http://localhost:3000)

### 5. Manual Verification Checklist
Follow these steps to ensure everything works:

**A. Tasks Feature**
- [ ] **Create Task**: Type "Test Task 1" in the input field and press Enter. It should appear instantly.
- [ ] **Toggle Complete**: Click the checkbox next to "Test Task 1". It should cross out.
- [ ] **Delete Task**: Hover over the task and click the trash icon. It should disappear.

**B. Dailies Feature**
- [ ] **Create Entry**: In the middle column, click "Today's" entry to expand it.
- [ ] **Type Journal**: Write "Testing the daily journal feature." Wait 1-2 seconds (it auto-saves).
- [ ] **Inline Task**: Click "+ Add task" inside the daily entry, type "Daily Task 1", and click Add.
- [ ] **Verify Sync**: Check the left "Tasks" column. "Daily Task 1" should appear there too.

**C. Tagging System**
- [ ] **Create Tag**: In the "Summary" column (right side), check the "Filters" section.
- [ ] **Add to Task**: Hover over a task, click the Tag icon. Type "Work" and click "Create 'Work'".
- [ ] **Filter**: Click the "Work" tag in the filter bar. Only tasks with that tag should show.
- [ ] **Clear Filter**: Click the "Clear" button to show all tasks again.

**D. Summary & AI**
- [ ] **Check Metrics**: Verify the numbers in the Summary column (Tasks Created/Completed) match your actions.
- [ ] **Generate AI Summary**: Click "Generate AI Summary". (Needs valid OpenAI Key). It should show a reflective paragraph.
- [ ] **Export**: Click the "Export" button in the top right. A `.md` file should download.

---

## PART 2: Deployment (Vercel)

The easiest way to deploy is using Vercel (creators of Next.js).

### 1. Push to GitHub
If you haven't already:
1. Initialize git: `git init`
2. Add files: `git add .`
3. Commit: `git commit -m "Initial commit"`
4. Create a new repository on GitHub and push your code.

### 2. Deploy on Vercel
1. Go to [Vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** > **"Project"**.
3. Select your **GitHub repository**.
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (should be auto-detected).
   - **Environment Variables**: Expand this section and add the same variables from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `OPENAI_API_KEY`
5. Click **Deploy**.

### 3. Final Check
Once deployed, Vercel will give you a live URL (e.g., `taskdaily.vercel.app`).
- Open the link.
- Test the app using the same checklist as above.
- *Note: Since it uses the same Supabase database, your local test data will be visible here too unless you clear the database.*
