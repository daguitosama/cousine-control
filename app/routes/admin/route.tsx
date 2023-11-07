import { AppLink } from "~/types/app";
import {
    RectangleStackIcon,
    UserGroupIcon,
    ArrowLeftOnRectangleIcon,
    ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { HeadersFunction, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { get_session, get_user_by_id, redirect_if_not_authorized } from "~/util/auth.server";
import { json } from "@remix-run/node";
import clsx from "clsx";
import { LogoutBtn } from "../logout";
import { client_safe_user } from "~/types/user";

// todo: check after some submission on products
// if this loader get's hit again
// in case it does
// stop re re evaluating (and hitting the db) if it does
// https://remix.run/docs/en/main/route/should-revalidate
// import type { ShouldRevalidateFunction } from "@remix-run/react";
//
// export const shouldRevalidate: ShouldRevalidateFunction = ({
//     actionResult,
//     currentParams,
//     currentUrl,
//     defaultShouldRevalidate,
//     formAction,
//     formData,
//     formEncType,
//     formMethod,
//     nextParams,
//     nextUrl,
// }) => {
//     return false;
// };

export async function loader({ request, context }: LoaderFunctionArgs) {
    const redirection = await redirect_if_not_authorized(request, "admin");
    if (redirection) {
        return redirection;
    }

    // todo:
    // refactor this shit to make TS know
    // that at this point the session has a valid `userId`
    const session = await get_session(request);
    // temp escape hatch from TS not knowing
    // todo: clean this shit when refactoring
    if (!session) {
        throw new Error("No session bitch");
    }
    //
    const user_op_result = await get_user_by_id({ id: session.userId });
    if (user_op_result.err) {
        throw new Error(user_op_result.err);
    }
    if (!user_op_result.ok) {
        throw new Error("No user found bitch");
    }

    return json(
        {
            user: client_safe_user(user_op_result.ok.user),
        },
        {
            headers: {
                "Server-Timing": `get_user_by_id;desc="(db) Get User by id";dur=${user_op_result.ok.time}`,
            },
        }
    );
}

export const headers: HeadersFunction = ({
    actionHeaders,
    loaderHeaders,
    parentHeaders,
    errorHeaders,
}) => {
    return {
        "Server-Timing": loaderHeaders.get("Server-Timing") as string,
    };
};

export default function AdminRoute() {
    const ADMIN_APP_LINKS: AppLink[] = [
        {
            id: "0",
            route: "/admin/products",
            label: "Products",
            icon: <RectangleStackIcon className='w-5 h-5' />,
        },
        {
            id: "1",
            route: "/admin/orders",
            label: "Orders",
            icon: <ArchiveBoxIcon className='w-5 h-5' />,
        },
        // {
        //     id: "1",
        //     route: "/admin/users",
        //     label: "Users",
        //     icon: <UserGroupIcon className='w-5 h-5' />,
        // },
    ];
    return (
        <div className='min-h-screen flex'>
            {/* nav sidebar */}
            <div className='w-[440px] border-r border-r-slate-200 '>
                <AdminAppSideBar links={ADMIN_APP_LINKS} />
            </div>

            {/* main app panel */}
            <div className='  w-full'>
                <div className='max-w-screen-lg 2xl:max-w-screen-2xl mx-auto px-[24px]'>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

function AdminAppSideBar({ links }: { links: AppLink[] }) {
    const loaderData = useLoaderData<typeof loader>();
    const firstLetter = loaderData.user.username.slice(0, 1);
    return (
        <div className='h-full px-[24px] relative'>
            {/* logo */}
            <div className='py-[20px] px-[10px]'>
                <h1 className='font-medium text-sm  leading-none'>Cousine Control</h1>
            </div>
            {/* menu links */}
            <div className='mt-[16px]'>
                <ul>
                    {links.map((app_link) => {
                        return (
                            <SidebarNavLink
                                app_link={app_link}
                                key={app_link.id}
                            />
                        );
                    })}
                </ul>
            </div>
            {/* user options */}
            <div className='fixed bottom-0 left-0 px-[24px] pb-[32px] flex items-center gap-[20px] '>
                <div className='-left-1 relative text-sm px-[10px] py-[10px] flex items-center gap-[8px]'>
                    <div className=' bg-neutral-200 rounded-full w-[30px] h-[30px] flex items-center justify-center px-[6px] py-[4px] leading-none uppercase'>
                        {firstLetter}
                    </div>
                    <div>{loaderData.user.username}</div>
                </div>
                <LogoutBtn />
            </div>
        </div>
    );
}

function SidebarNavLink({ app_link, ...props }: { app_link: AppLink }) {
    const base_classes = "rounded-lg py-[10px] px-[8px] flex items-center gap-[8px]";
    const pending_classes = "bg-neutral-50 animate-pulse";
    const active_classes = "bg-neutral-100 opacity-100";
    function dynamic_classes({ isActive, isPending }: { isActive: boolean; isPending: boolean }) {
        //   const classes = clsx(base_classes);
        if (isActive) {
            return clsx(base_classes, active_classes);
        }
        if (isPending) {
            return clsx(base_classes, pending_classes);
        } else {
        }
        return base_classes;
    }

    return (
        <li className=' '>
            <NavLink
                to={app_link.route}
                className={dynamic_classes}
            >
                {app_link.icon}
                <span className='text-sm leading-none'>{app_link.label}</span>
            </NavLink>
        </li>
    );
}
