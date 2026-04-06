import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function InlinePromotionBanner() {
    return (
        <aside className="flex items-center justify-between gap-8 rounded-xl bg-muted p-12">
            <Badge>PRO</Badge>
            <span>
                Upgrade for full access to Cache —{" "}
                <Button variant="link">Get Pro</Button>
            </span>
        </aside>
    );
}

function BlockPromotionBanner({ length }: { length: number }) {
    return (
        <aside className="sticky top-0 z-10 -mx-12 my-32 overflow-x-clip">
            <div className="flex flex-col items-center justify-center gap-y-24 self-stretch py-24 transition-shadow">
                <div className="flex flex-col items-center gap-y-16 px-12 text-center">
                    <h1 className="font-semibold text-3xl md:text-4xl">
                        Access all {length} bookmarks.
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Get unlimited access to the full library &amp; pro
                        features from{" "}
                        <span className="font-semibold text-foreground">
                            €5/month
                        </span>{" "}
                        — cancel anytime.
                    </p>
                </div>
                <Button size="xl">Get Pro</Button>
            </div>
        </aside>
    );
}

export { BlockPromotionBanner, InlinePromotionBanner };
