import { auth } from "@/lib/auth/server";
import { prisma } from "@/prisma";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

/**
 * Returns the current extension ingest token (may be null until generated).
 */
export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        select: { extensionIngestToken: true },
        where: { id: session.user.id },
    });

    return Response.json({ token: user?.extensionIngestToken ?? null });
}

/**
 * Generates a new random ingest token and replaces any previous one.
 */
export async function POST() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = nanoid(48);
    await prisma.user.update({
        data: { extensionIngestToken: token },
        where: { id: session.user.id },
    });

    return Response.json({ token });
}
