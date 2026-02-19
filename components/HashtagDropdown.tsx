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
        <div className="absolute z-50 w-48 bg-black border border-neutral-800 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
            {tags.map((tag, index) => (
                <button
                    key={tag.id}
                    onClick={() => onSelect(tag.name)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono ${index === selectedIndex
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                        }`}
                >
                    #{tag.name}
                </button>
            ))}
        </div>
    );
}
