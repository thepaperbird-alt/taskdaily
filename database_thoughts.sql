-- Thoughts Table
CREATE TABLE td_thoughts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_td_thoughts_user_id ON td_thoughts(user_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE td_thoughts ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can CRUD their own thoughts" ON td_thoughts
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
