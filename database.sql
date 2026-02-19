-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DAILIES TABLE
CREATE TABLE td_dailies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    entry_date DATE NOT NULL,
    content TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);

-- TASKS TABLE
CREATE TABLE td_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    source TEXT CHECK (source IN ('manual', 'daily')) NOT NULL DEFAULT 'manual',
    daily_id UUID REFERENCES td_dailies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TAGS TABLE
CREATE TABLE td_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'neutral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- TASK TAGS JOIN TABLE
CREATE TABLE td_task_tags (
    task_id UUID REFERENCES td_tasks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES td_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- DAILY TAGS JOIN TABLE
CREATE TABLE td_daily_tags (
    daily_id UUID REFERENCES td_dailies(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES td_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (daily_id, tag_id)
);

-- WEEKLY SUMMARIES TABLE
CREATE TABLE td_weekly_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    summary_text TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_td_tasks_user_id ON td_tasks(user_id);
CREATE INDEX idx_td_dailies_user_id ON td_dailies(user_id);
CREATE INDEX idx_td_tags_user_id ON td_tags(user_id);
CREATE INDEX idx_td_tasks_created_at ON td_tasks(created_at);
CREATE INDEX idx_td_dailies_entry_date ON td_dailies(entry_date);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE td_dailies ENABLE ROW LEVEL SECURITY;
ALTER TABLE td_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE td_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE td_task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE td_daily_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE td_weekly_summaries ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Dailies
CREATE POLICY "Users can CRUD their own dailies" ON td_dailies
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users can CRUD their own tasks" ON td_tasks
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Tags
CREATE POLICY "Users can CRUD their own tags" ON td_tags
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Task Tags
CREATE POLICY "Users can CRUD their own task_tags" ON td_task_tags
    USING (EXISTS (SELECT 1 FROM td_tasks WHERE id = td_task_tags.task_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM td_tasks WHERE id = td_task_tags.task_id AND user_id = auth.uid()));

-- Daily Tags
CREATE POLICY "Users can CRUD their own daily_tags" ON td_daily_tags
    USING (EXISTS (SELECT 1 FROM td_dailies WHERE id = td_daily_tags.daily_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM td_dailies WHERE id = td_daily_tags.daily_id AND user_id = auth.uid()));

-- Weekly Summaries
CREATE POLICY "Users can CRUD their own weekly_summaries" ON td_weekly_summaries
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
