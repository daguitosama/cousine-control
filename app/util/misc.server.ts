import { User } from "~/types/user";

export function default_app_link_for_role(role: User["user_role"]): string {
    if (role == "admin") return `/admin/products`;
    return `/server/orders`;
}
