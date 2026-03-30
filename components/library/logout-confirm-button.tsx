"use client";

import type * as React from "react";
import {
    AlertDialog,
    AlertDialogClose,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogPopup,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutConfirmButton(): React.ReactElement {
    const router = useRouter();

    return (
        <AlertDialog>
            <AlertDialogTrigger render={<Button size="xs" variant="link" />}>
                Log out
            </AlertDialogTrigger>
            <AlertDialogPopup>
                <AlertDialogHeader>
                    <AlertDialogTitle>Log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You will need to sign in again to access your library.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogClose
                        render={<Button size="sm" variant="ghost" />}
                    >
                        Cancel
                    </AlertDialogClose>
                    <AlertDialogClose
                        onClick={() => {
                            router.push("/logout");
                        }}
                        render={<Button size="sm" />}
                    >
                        Log out
                    </AlertDialogClose>
                </AlertDialogFooter>
            </AlertDialogPopup>
        </AlertDialog>
    );
}
