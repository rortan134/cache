"use client";

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
import type * as React from "react";

function LogoutDialogButton(
    props: React.ComponentProps<typeof AlertDialogTrigger>
) {
    const router = useRouter();

    return (
        <AlertDialog>
            <AlertDialogTrigger {...props} />
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

export { LogoutDialogButton };
