import type { DataFunctionArgs, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/node";
import { authenticate, get_session } from "~/util/auth.server";
import { z } from "~/util/lib.server";
import {
    LoginSubmissionSchema,
    PasswordSchema,
    UsernameSchema,
} from "~/util/user_validation.server";
import { useFetcher } from "@remix-run/react";

type LoaderData = {};

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await get_session(request);
    // no auth serve as usual
    if (!session) {
        return json<LoaderData>({});
    }
    // session found
    // reroute to his `role` based app section
    return redirect(`/app/${session.role}/`);
}

type ActionData = {
    error: {
        username: string | null;
        password: string | null;
        auth_error: string | null;
    };
};

export async function action({ request, context }: DataFunctionArgs) {
    /**
     check
     - user exists
     - valid password
     --------
     if not render errors
     ---------
     else 
     -  create the session
     -  redirect to his `role` app section
     */
    const formData = await request.formData();
    const submission = LoginSubmissionSchema.safeParse({
        username: formData.get("username"),
        password: formData.get("password"),
    });

    if (!submission.success) {
        return json({ error: submission.error }, { status: 400 });
    }
    const authenticate_operation = await authenticate({
        username: submission.data.username,
        password: submission.data.password,
        sql: context.sql,
    });

    if (authenticate_operation.err) {
        return json({ error: { auth_error: authenticate_operation.err } }, { status: 500 });
    }
    if (!authenticate_operation.ok) {
        return json(
            {
                error: {
                    auth_error: "Edge case of authenticate, learn how to do Go like Results Pairs",
                },
            },
            { status: 500 }
        );
    }
    const cookieSession = await context.session_storage.getSession(request.headers.get("cookie"));
    cookieSession.set("userId", authenticate_operation.ok.userId);
    cookieSession.set("role", authenticate_operation.ok.role);

    return redirect(`/app/${authenticate_operation.ok.role}`, {
        headers: { "Set-Cookie": await context.session_storage.commitSession(cookieSession) },
    });
}

export default function LoginRoute() {
    const fetcher = useFetcher();
    return (
        <div className=''>
            <div className='max-w-[400px] mx-auto px-[30px] mt-[100px]'>
                <div>
                    <h1 className='text-4xl'>Login</h1>
                    <p className='mt-[20px] text-gray-600'>
                        Fill your credentials to continue to Cousine Control
                    </p>
                </div>
                <fetcher.Form
                    method='post'
                    className='mt-[30px] grid grid-cols-1 gap-[20px]'
                >
                    <div className='grid grid-cols-1 gap-[10px]'>
                        <label
                            htmlFor='username-input'
                            className='px-[6px]'
                        >
                            Username
                        </label>
                        <input
                            type='text'
                            name='username'
                            id='username-input'
                            min={3}
                            max={20}
                            pattern='^[a-zA-Z0-9_]+$'
                            title='Username can only include letters, numbers, and underscores. And must be between 3 and 20 characters'
                            className='border border-black/50 rounded-md py-[6px] px-[6px]'
                            required
                        />
                    </div>

                    <div className='grid grid-cols-1 gap-[10px]'>
                        <label
                            htmlFor='password-input'
                            className='px-[6px]'
                        >
                            Password
                        </label>
                        <input
                            type='password'
                            name='password'
                            id='password-input'
                            className='border border-black/50 rounded-md py-[6px] px-[6px]'
                            min={8}
                            max={100}
                            required
                        />
                    </div>
                    <div className='pt-[10px]'>
                        <button
                            className='border border-black/50 rounded-md py-[6px] px-[6px] w-full'
                            disabled={fetcher.state != "idle"}
                        >
                            {fetcher.state != "idle" ? "Submitting" : "Submit"}
                        </button>
                    </div>
                </fetcher.Form>
            </div>
        </div>
    );
}
