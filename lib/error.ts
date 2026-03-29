// biome-ignore-all lint/suspicious/noExplicitAny: any
import * as z from "zod";

export abstract class NamedError extends Error {
    abstract schema(): z.ZodSchema;
    abstract toObject(): { name: string; data: any };

    static create<Name extends string, Data extends z.ZodSchema>(
        name: Name,
        data: Data
    ) {
        const schema = z.object({
            data,
            name: z.literal(name),
        });

        const result = class extends NamedError {
            static readonly Schema = schema;

            override readonly name: Name = name;
            readonly data: z.input<Data>;

            constructor(errorData: z.input<Data>, options?: ErrorOptions) {
                const message =
                    errorData && typeof (errorData as any).message === "string"
                        ? (errorData as any).message
                        : name;
                super(message ?? name, options);
                this.name = name;
                this.data = errorData;
            }

            static isInstance(
                input: any
            ): input is InstanceType<typeof result> {
                return (
                    typeof input === "object" &&
                    input !== null &&
                    "name" in input &&
                    (input as { name: unknown }).name === name
                );
            }

            schema() {
                return schema;
            }

            toObject() {
                return {
                    data: this.data,
                    name,
                };
            }
        };

        Object.defineProperty(result, "name", { value: name });
        return result;
    }

    static readonly Unknown = NamedError.create(
        "UnknownError",
        z.object({
            message: z.string(),
        })
    );
}

export function extractNamedErrorMessage(e: unknown): {
    name?: string;
    operation?: string;
    message: string;
} {
    if (e instanceof NamedError) {
        const data = (e as unknown as { data?: Record<string, unknown> }).data;
        const operation =
            typeof data?.operation === "string" ? data.operation : undefined;
        const message =
            (typeof data?.message === "string" && data.message) ||
            (e as Error).message;
        return { message, name: e.name, operation };
    }

    const errObj = e as Error & {
        data?: { message?: string; operation?: string };
    };
    return {
        message: errObj?.data?.message ?? errObj?.message ?? "Unknown error",
        name: undefined,
        operation: errObj?.data?.operation,
    };
}
