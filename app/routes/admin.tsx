import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/node";
import { get_session } from "~/util/auth.server";
type LoaderData = {
    p: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await get_session(request);
    // no auth serve as usual
    if (!session) {
        return redirect(`/login/`);
    }
    return json({});
}

export default function AdminPanel() {
    return (
        <div className=''>
            <div className='text-center mx-auto'>
                <h1 className='text-4xl mt-[50px]'>Admin Route</h1>
            </div>
        </div>
    );
}
