import dynamic from "next/dynamic";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type * as React from "react";

const FeedbackWidget = dynamic(() =>
    import("@/components/feedback/feedback-widget").then(
        (mod) => mod.FeedbackWidget
    )
);

export default function LibraryLayout({ children }: React.PropsWithChildren) {
    return (
        <NuqsAdapter>
            {children}
            <FeedbackWidget />
        </NuqsAdapter>
    );
}
