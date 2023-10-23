import { AppLink } from "~/types/app";
import {
    RectangleStackIcon,
    UserGroupIcon,
    ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { NavLink, Outlet } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { redirect_if_not_authorized } from "~/util/auth.server";
import { json } from "@remix-run/node";
import clsx from "clsx";
import { LogoutBtn } from "../logout";

export async function loader({ request }: LoaderFunctionArgs) {
    const redirection = await redirect_if_not_authorized(request, "admin");
    if (redirection) {
        return redirection;
    }

    // product get logic
    return json({});
}

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
            route: "/admin/users",
            label: "Users",
            icon: <UserGroupIcon className='w-5 h-5' />,
        },
    ];
    return (
        <div className='min-h-screen flex'>
            {/* nav sidebar */}
            <div className='w-[440px] border-r border-r-slate-200 '>
                <AdminAppSideBar links={ADMIN_APP_LINKS} />
            </div>

            {/* main app panel */}
            <div className='  w-full'>
                <Outlet />
            </div>
        </div>
    );
}

function AdminAppSideBar({ links }: { links: AppLink[] }) {
    return (
        <div className='h-full px-[24px] relative'>
            {/* logo */}
            <div className='py-[20px] px-[10px]'>
                {" "}
                <h1 className='font-medium text-sm  leading-none'>Cousine Control</h1>
            </div>
            {/* menu links */}
            <div className='mt-[16px]'>
                <ul>
                    {links.map((app_link) => {
                        return <SidebarNavLink app_link={app_link} />;
                    })}
                </ul>
            </div>
            {/* user options */}
            <div className='fixed bottom-0 left-0 px-[24px] pb-[32px]'>
                <LogoutBtn />
            </div>
        </div>
    );
}

function SidebarNavLink({ app_link }: { app_link: AppLink }) {
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
        <li
            key={app_link.id}
            className=' '
        >
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
