"use server";

import { auth } from "@/lib/auth/server";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

export async function regenerateExtensionIngestToken(locale: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const token = nanoid(48);
    await prisma.user.update({
        data: { extensionIngestToken: token },
        where: { id: session.user.id },
    });

    revalidatePath(`/${locale}/library`);
}
