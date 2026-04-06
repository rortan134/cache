export interface PresetCollection {
    description: string;
    name: string;
}

export const PRESET_COLLECTIONS: PresetCollection[] = [
    {
        description: "Articles, essays, and long-reads to get through when you have a moment.",
        name: "Reading List",
    },
    {
        description: "Visuals, designs, and ideas that spark creativity.",
        name: "Inspiration",
    },
    {
        description: "Educational content, how-tos, and documentation for learning new skills.",
        name: "Tutorials & Guides",
    },
    {
        description: "Dishes to try, cooking tips, and culinary inspiration.",
        name: "Recipes",
    },
    {
        description: "Videos and movies to catch up on.",
        name: "Watch Later",
    },
];
