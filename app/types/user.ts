export type User = {
    id: string;
    username: string;
    hashed_password: string;
    user_role: "admin" | "server";
};

export type ClientSafeUser = {
    id: string;
    username: string;
    user_role: "admin" | "server";
};

export function client_safe_user(user: User): ClientSafeUser {
    return {
        id: user.id,
        username: user.username,
        user_role: user.user_role,
    };
}
