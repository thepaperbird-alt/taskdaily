export default function HashtagDropdown({
    isOpen,
    tags,
    selectedIndex,
    onSelect
}: {
    isOpen: boolean;
    tags: { id: string; name: string }[];
    selectedIndex: number;
    onSelect: (tag: string) => void;
}) {
    if (!isOpen || tags.length === 0) return null;

    return (
        <div className="absolute z-50 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
            {tags.map((tag, index) => (
                <button
                    key={tag.id}
                    onClick={() => onSelect(tag.name)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono ${index === selectedIndex
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        }`}
                >
                    #{tag.name}
                </button>
            ))}
        </div>
    );
}
