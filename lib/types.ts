export type Task = {
    id: string;
    title: string;
    completed: boolean;
    source: 'manual' | 'daily';
    daily_id: string | null;
    created_at: string;
    tags?: Tag[];
};

export type Daily = {
    id: string;
    entry_date: string;
    content: string;
    created_at: string;
    tasks?: Task[];
    tags?: Tag[];
};

export type Tag = {
    id: string;
    name: string;
    color: string;
    created_at: string;
};

export type WeeklySummary = {
    id: string;
    week_start: string;
    summary_text: string;
    generated_at: string;
};
