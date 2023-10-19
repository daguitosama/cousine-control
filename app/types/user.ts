export type User = {
    id: string;
    username: string;
    hashed_password: string;
    user_role: "admin" | "server";
};
