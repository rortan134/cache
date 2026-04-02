import { authClient } from "@/lib/auth/client";
import useSWR from "swr";

const { useSession } = authClient;

async function getActiveSubscription(input: { email?: string }) {
    if (!input?.email) {
        return null;
    }
    const { data: subscriptions, error } = await authClient.subscription.list();
    if (error) {
        throw new Error(error.message);
    }
    const activeSubscription = subscriptions.find(
        (sub) => sub.status === "active" || sub.status === "trialing"
    );
    return activeSubscription ?? null;
}

function useAccess() {
    const {
        data: session,
        error: sessionError,
        isPending,
        refetch: mutate,
    } = useSession();

    // Let error boundary catch
    if (sessionError) {
        throw sessionError;
    }

    const { data: subscription, isLoading } = useSWR<
        Awaited<ReturnType<typeof getActiveSubscription>>
    >(() =>
        session?.user.email
            ? getActiveSubscription({ email: session?.user.email })
            : null
    );

    const hasAccess =
        subscription?.status === "active" ||
        subscription?.status === "trialing";

    return { hasAccess, isLoading, isPending, mutate, subscription };
}

export { useAccess };
