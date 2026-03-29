/** Globals set by NextChatSDKBootstrap in app/layout.tsx (ChatGPT / iframe SDK). */
declare global {
    interface Window {
        innerBaseUrl?: string;
        __isChatGptApp?: boolean;
        openai?: {
            openExternal: (opts: { href: string }) => void;
        };
    }
}

export {};
