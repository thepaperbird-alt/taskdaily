export function extractHashtags(text: string): string[] {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    if (!matches) return [];
    // Remove the # directly here or keep it? 
    // Usually we want the tag name without #.
    return matches.map(tag => tag.substring(1));
}
