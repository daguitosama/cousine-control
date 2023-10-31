// app/sessions.ts
import { createCookieSessionStorage, redirect, json } from "@remix-run/node"; // or cloudflare/deno
import env from "./env.server";
import { User } from "~/types/user";
import bcrypt from "bcryptjs";
import { db } from "./db.server";
import { new_timer } from "./misc.server";

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
}: {
    username: string;
    password: string;
}): Promise<AuthenticateOperationResult> {
    const getUserResult = await getUserByUserName({ username });
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

type GetUserResultByUserName = {
    ok: User | null;
    err: string | null;
};
async function getUserByUserName({
    username,
}: {
    username: string;
}): Promise<GetUserResultByUserName> {
    const sql = db();
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
type GetUserByIdSuccess = {
    ok: { user: User; time: number };
    err: null;
};
type GetUserByIdError = {
    ok: null;
    err: string;
};
type GetUserByIdResult = GetUserByIdSuccess | GetUserByIdError;
export async function get_user_by_id({ id }: { id: string }): Promise<GetUserByIdResult> {
    const timer = new_timer();
    const sql = db();
    try {
        const userRows = await sql<User[]>`
        select * from users where id = ${id};
    `;
        if (!userRows.length) {
            return { ok: null, err: "User not found" };
        }
        return { ok: { user: userRows[0], time: timer.delta() }, err: null };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return { ok: null, err: `DB ERROR: ${error.message}` };
        }
        return { ok: null, err: "Unknown Error" };
    }
}

function is_user_role(role: string): role is User["user_role"] {
    return role == "admin" || role == "server";
}

function role_is_in_roles(role: string, roles: User["user_role"][]): boolean {
    if (!is_user_role(role)) {
        return false;
    }

    if (!roles.includes(role)) {
        return false;
    }

    return true;
}

type Redirect_If_Not_Authorized_Result = ReturnType<typeof redirect> | false;
// todo: make this fn return also the session
// with discriminator types 👇
// https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
export async function redirect_if_not_authorized(
    request: Request,
    role_or_roles: User["user_role"] | Array<User["user_role"]>
): Promise<Redirect_If_Not_Authorized_Result> {
    //
    const session = await get_session(request);
    //
    if (!session) {
        return redirect(`/login/`);
    }
    var is_authorized: boolean = false;

    if (Array.isArray(role_or_roles)) {
        is_authorized = role_is_in_roles(session.role, role_or_roles);
    } else {
        is_authorized = role_is_in_roles(session.role, [role_or_roles]);
    }

    if (!is_authorized) {
        return redirect(`/login/`);
    }
    // allow pass
    return false;
}
