-- Media Watchlist Table
CREATE TABLE td_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    type TEXT CHECK (type IN ('movie', 'tv')) NOT NULL DEFAULT 'movie',
    status TEXT CHECK (status IN ('to_watch', 'current', 'completed')) NOT NULL DEFAULT 'to_watch',
    platform TEXT,
    season TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_td_media_user_id ON td_media(user_id);
CREATE INDEX idx_td_media_status ON td_media(status);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE td_media ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can CRUD their own media" ON td_media
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
