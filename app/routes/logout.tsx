import type { DataFunctionArgs, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/node";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

export async function loader({ request }: LoaderFunctionArgs) {
    return json({});
}

export async function action({ request, context }: DataFunctionArgs) {
    const session = await context.session_storage.getSession(request.headers.get("Cookie"));
    return redirect("/login/", {
        headers: {
            "Set-Cookie": await context.session_storage.destroySession(session),
        },
    });
}

export function LogoutBtn() {
    return (
        <form
            action='/logout'
            method='post'
        >
            <button className='rounded-lg py-[10px] px-[8px] flex items-center gap-[8px]'>
                <span className='text-sm leading-none'>Logout</span>
                <ArrowLeftOnRectangleIcon className='w-5 h-5 rotate-180' />
            </button>
        </form>
    );
}
