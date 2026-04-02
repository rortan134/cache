import {
    fileOpen as _fileOpen,
    fileSave as _fileSave,
} from "browser-fs-access";

export const fileOpen = <M extends boolean | undefined = false>(options: {
    extensions?: string[];
    description: string;
    multiple?: M;
}) => {
    const extensions = options.extensions?.reduce((acc, ext) => {
        if (ext === "jpg") {
            return acc.concat(".jpg", ".jpeg");
        }
        return acc.concat(`.${ext}`);
    }, [] as string[]);

    return _fileOpen({
        description: options.description,
        extensions,
        // mimeTypes,
        multiple: options.multiple ?? false,
    });
};

export const saveFile = (
    blob: Blob | Promise<Blob>,
    options: {
        /** supply without the extension */
        name: string;
        /** file extension */
        extension: string; // TODO: specify specific extensions
        description: string;
        /** existing FileSystemHandle */
        fileHandle?: FileSystemFileHandle | null;
        onError?: (error: unknown) => void;
    }
) => {
    try {
        return _fileSave(
            blob,
            {
                description: options.description,
                extensions: [`.${options.extension}`],
                fileName: `${options.name}.${options.extension}`,
            },
            options.fileHandle
        );
    } catch (error) {
        options.onError?.(error);
    }
};

// export { supported as nativeFileSystemSupported } from "browser-fs-access";
export type { FileSystemHandle } from "browser-fs-access";
