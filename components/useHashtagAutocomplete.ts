import { useState, useEffect, useRef } from 'react';

export function useHashtagAutocomplete(
    text: string,
    setText: (s: string) => void,
    allTags: { id: string; name: string }[]
) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [cursorIndex, setCursorIndex] = useState(0);
    const [filteredTags, setFilteredTags] = useState<{ id: string; name: string }[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [matchStart, setMatchStart] = useState(-1);

    // Analyze text at cursor when it changes (or cursor moves)
    // We need the input ref to bind events, but logic is generic.

    const checkForHashtag = (currentText: string, cursorPos: number) => {
        // Look back from cursor for #
        const textBeforeCursor = currentText.slice(0, cursorPos);
        const lastHash = textBeforeCursor.lastIndexOf('#');

        if (lastHash !== -1) {
            // Check if there's a space between hash and cursor (invalid for autocomplete usually, or new word)
            // We allow typing #ta... so no spaces allowed after hash for now.
            const query = textBeforeCursor.slice(lastHash + 1);
            if (!/\s/.test(query)) {
                // Valid hashtag start
                const matches = allTags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
                if (matches.length > 0) {
                    setMatchStart(lastHash);
                    setFilteredTags(matches);
                    setShowDropdown(true);
                    setSelectedIndex(0);
                    return;
                }
            }
        }
        setShowDropdown(false);
    };

    const selectTag = (tag: string) => {
        if (matchStart === -1) return;
        const prefix = text.slice(0, matchStart);
        const suffix = text.slice(cursorIndex); // Text after cursor
        // We want to replace the current query with the tag
        const newText = `${prefix}#${tag} ${suffix}`;
        setText(newText);
        setShowDropdown(false);
        // We'd ideally move cursor too, but simplistic for now.
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => (i + 1) % filteredTags.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => (i - 1 + filteredTags.length) % filteredTags.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            selectTag(filteredTags[selectedIndex]?.name);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value;
        const pos = e.target.selectionStart || 0;
        setText(val);
        setCursorIndex(pos);
        checkForHashtag(val, pos);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const pos = (e.target as HTMLInputElement).selectionStart || 0;
        setCursorIndex(pos);
        checkForHashtag(text, pos);
    }

    return {
        showDropdown,
        filteredTags,
        selectedIndex,
        handleKeyDown,
        handleChange,
        handleSelect,
        selectTag
    };
}
