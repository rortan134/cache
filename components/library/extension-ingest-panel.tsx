import { regenerateExtensionIngestToken } from "@/lib/library/regenerate-ingest-token";

interface Props {
    readonly locale: string;
    readonly token: string | null;
}

export function ExtensionIngestPanel({ locale, token }: Props) {
    return (
        <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
            <h3 className="font-medium text-sm">Browser extension</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
                Copy this token into the extension Options (Bearer token). Use
                the same site URL as your sync endpoint origin. Regenerating
                invalidates the previous token.
            </p>
            {token ? (
                <code className="break-all rounded-md bg-muted px-2 py-2 font-mono text-[11px] leading-snug">
                    {token}
                </code>
            ) : (
                <p className="text-muted-foreground text-xs">
                    No token yet — generate one to sync from Instagram or
                    TikTok.
                </p>
            )}
            <form action={regenerateExtensionIngestToken.bind(null, locale)}>
                <button
                    className="rounded-lg border border-border bg-background px-3 py-2 font-medium text-sm transition hover:bg-muted"
                    type="submit"
                >
                    {token ? "Regenerate token" : "Generate token"}
                </button>
            </form>
        </section>
    );
}
