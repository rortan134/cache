import { auth } from "@/lib/auth/server";
import {
    createPickerSession,
    getPickerSession,
    GooglePhotosPickerApiError,
    pickerPollIntervalMs,
    withPickerAutoclose,
} from "@/lib/google-photos/picker-api";
import { headers } from "next/headers";

async function resolveGoogleAccessToken(): Promise<string | null> {
    const tokenResponse = await auth.api.getAccessToken({
        body: { providerId: "google" },
        headers: await headers(),
    });
    return tokenResponse?.accessToken ?? null;
}

export async function POST() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await resolveGoogleAccessToken();
    if (!accessToken) {
        return Response.json(
            { error: "Missing Google access token. Reconnect Google first." },
            { status: 403 }
        );
    }

    try {
        const pickerSession = await createPickerSession(accessToken);
        return Response.json({
            pickerUri: pickerSession.pickerUri
                ? withPickerAutoclose(pickerSession.pickerUri)
                : null,
            pollIntervalMs: pickerPollIntervalMs(
                pickerSession.pollingConfig?.pollInterval
            ),
            sessionId: pickerSession.id,
            timeoutIn: pickerSession.pollingConfig?.timeoutIn ?? null,
        });
    } catch (error) {
        if (error instanceof GooglePhotosPickerApiError) {
            return Response.json(
                { error: error.message },
                { status: error.status }
            );
        }
        throw error;
    }
}

export async function GET(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return Response.json({ error: "Missing session id" }, { status: 400 });
    }

    const accessToken = await resolveGoogleAccessToken();
    if (!accessToken) {
        return Response.json(
            { error: "Missing Google access token. Reconnect Google first." },
            { status: 403 }
        );
    }

    try {
        const pickerSession = await getPickerSession(accessToken, id);
        return Response.json({
            mediaItemsSet: Boolean(pickerSession.mediaItemsSet),
            pollIntervalMs: pickerPollIntervalMs(
                pickerSession.pollingConfig?.pollInterval
            ),
            sessionId: pickerSession.id,
            timeoutIn: pickerSession.pollingConfig?.timeoutIn ?? null,
        });
    } catch (error) {
        if (error instanceof GooglePhotosPickerApiError) {
            return Response.json(
                { error: error.message },
                { status: error.status }
            );
        }
        throw error;
    }
}
