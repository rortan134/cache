export function normalizeCollectionName(name: string): {
    name: string;
    nameKey: string;
} {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    return {
        name: normalizedName,
        nameKey: normalizedName.toLocaleLowerCase(),
    };
}
