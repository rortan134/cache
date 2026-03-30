/** Globals set by NextChatSDKBootstrap in app/layout.tsx (ChatGPT / iframe SDK). */
declare global {
    interface Window {
        __isChatGptApp?: boolean;
        innerBaseUrl?: string;
        openai?: {
            openExternal: (opts: { href: string }) => void;
        };
    }
}

export {};
