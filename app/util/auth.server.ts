// app/sessions.ts
import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno
import env from "./env.server";
import postgres from "postgres";
import { User } from "~/types/user";
import bcrypt from "bcryptjs";

type SessionData = {
    userId: string;
    role: string;
};

type SessionFlashData = {
    error: string;
};

export const session_storage = createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
        name: "__session",

        // all of these are optional
        // domain: "remix.run",
        // Expires can also be set (although maxAge overrides it when used in combination).
        // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
        //
        // expires: new Date(Date.now() + 60_000),
        httpOnly: true,
        // maxAge: 60 * 60,
        path: "/",
        sameSite: "lax",
        secrets: [env().COOKIE_SECRET],
        secure: true,
    },
});

export async function get_session(request: Request): Promise<SessionData | null> {
    const cookieHeader = request.headers.get("cookie");
    const session = session_storage.getSession(cookieHeader);
    const userId = (await session).get("userId");
    var role = (await session).get("role") ?? "";
    // no valid session
    if (!userId || !role || !["admin", "server"].includes(role)) {
        return null;
    }
    // valid session
    return {
        userId,
        role,
    };
}

type AuthenticateOperationResult = {
    ok: SessionData | null;
    err: string | null;
};
export async function authenticate({
    username,
    password,
    sql,
}: {
    username: string;
    password: string;
    sql: postgres.Sql;
}): Promise<AuthenticateOperationResult> {
    const getUserResult = await getUser({ username, sql });
    if (getUserResult.err || !getUserResult.ok) {
        return { ok: null, err: getUserResult.err };
    }

    const password_is_valid = bcrypt.compare(password, getUserResult.ok.hashed_password);
    if (!password_is_valid) {
        return { ok: null, err: "Username and password don't match" };
    }

    return Promise.resolve({
        ok: {
            role: getUserResult.ok.user_role,
            userId: getUserResult.ok.id,
        },
        err: null,
    });
}

type GetUserResult = {
    ok: User | null;
    err: string | null;
};
async function getUser({
    username,
    sql,
}: {
    username: string;
    sql: postgres.Sql;
}): Promise<GetUserResult> {
    try {
        const userRows = await sql<User[]>`
        select * from users where username = ${username};
    `;
        if (!userRows.length) {
            throw new Error("User not found");
        }
        return { ok: userRows[0], err: null };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return { ok: null, err: error.message };
        }
        return { ok: null, err: "Unknown Error" };
    }
}