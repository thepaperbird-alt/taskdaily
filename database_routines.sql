-- Routines Table
CREATE TABLE td_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    time TEXT NOT NULL, -- e.g. '09:00'
    days TEXT[] NOT NULL, -- e.g. ['Monday', 'Wednesday']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_td_routines_user_id ON td_routines(user_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE td_routines ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can CRUD their own routines" ON td_routines
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
