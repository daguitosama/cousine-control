import { z } from "zod";

const Env_Schema = z.object({
    DB_URL: z.string({
        required_error: "DB_URL missing",
        invalid_type_error: "DB_URL missing",
    }),
    COOKIE_SECRET: z.string({
        required_error: "COOKIE_SECRET missing",
        invalid_type_error: "COOKIE_SECRET missing",
    }),
});

export default function env() {
    return Env_Schema.parse(process.env);
}
