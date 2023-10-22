// app/sessions.ts
import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno
import env from "./env.server";
import postgres from "postgres";
import { User } from "~/types/user";
import bcrypt from "bcryptjs";

type SessionData = {
    userId: string;
    role: User["user_role"];
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
    // validate role (TS inference is useless at runtime)
    if (!userId || !role || !["admin", "server"].includes(role)) {
        return null;
    }
    // valid session
    return {
        userId,
        role,
    } as SessionData; // fix TS role type dropping, was validated at runtime above
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
    if (getUserResult.err) {
        return { ok: null, err: getUserResult.err };
    }
    // user not found
    if (!getUserResult.ok) {
        // do not expose user-not-found
        // just signal username-pass miss match
        return { ok: null, err: "Username and password don't match" };
    }

    const password_is_valid = await bcrypt.compare(password, getUserResult.ok.hashed_password);
    console.log({
        password_is_valid,
        password,
        hashed_password: getUserResult.ok.hashed_password,
    });
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
            // throw new Error("DB ERROR: User not found");
            return { ok: null, err: null };
        }
        return { ok: userRows[0], err: null };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return { ok: null, err: `DB ERROR: ${error.message}` };
        }
        return { ok: null, err: "Unknown Error" };
    }
}
