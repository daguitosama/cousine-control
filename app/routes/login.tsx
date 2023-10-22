import type { DataFunctionArgs, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/node";
import { authenticate, get_session } from "~/util/auth.server";
import { LoginSubmissionSchema } from "~/util/user_validation.server";
import { useActionData, useFetcher } from "@remix-run/react";
import { default_app_link_for_role } from "~/util/misc.server";

type LoaderData = {};

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await get_session(request);
    // no auth serve as usual
    if (!session) {
        return json<LoaderData>({});
    }
    // session found
    // reroute to his `role` based app section

    return redirect(default_app_link_for_role(session.role));
}

type ActionData = {
    error: {
        auth_error?: string | null;
        username?: string | null;
        password?: string | null;
    };
};
function mapParsingErrors(error: Zod.ZodError): ActionData["error"] {
    const result_error: ActionData["error"] = {};
    error.issues.map((issue) => {
        if (issue.path[0] == "username") {
            result_error.username = issue.message;
        }
        if (issue.path[0] == "password") {
            result_error.password = issue.message;
        }
    });
    return result_error;
}
export async function action({ request, context }: DataFunctionArgs) {
    // test error
    // return json<ActionData>({ error: { auth_error: "sample auth error kaboom" } });
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
        return json({ error: mapParsingErrors(submission.error) }, { status: 400 });
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
            { status: 400 }
        );
    }
    const cookieSession = await context.session_storage.getSession(request.headers.get("cookie"));
    cookieSession.set("userId", authenticate_operation.ok.userId);
    cookieSession.set("role", authenticate_operation.ok.role);

    return redirect(`/${authenticate_operation.ok.role}/`, {
        headers: { "Set-Cookie": await context.session_storage.commitSession(cookieSession) },
    });
}

export default function LoginRoute() {
    const fetcher = useFetcher();
    const actionData = fetcher.data as undefined | ActionData;
    const html_log = (
        <pre className='text-sm font-mono bg-gray-100 shadow-sm px-[20px] py-[20px]'>
            <code>{JSON.stringify({ actionData }, null, 2)}</code>
        </pre>
    );
    return (
        <div className=''>
            <div className='max-w-[400px] mx-auto px-[30px] mt-[150px]'>
                <div>
                    <h1 className='text-4xl'>Login</h1>
                    <p className='mt-[20px] text-gray-600'>
                        Fill your credentials to continue to Cousine Control
                    </p>
                </div>
                {actionData?.error?.auth_error && (
                    <div className='mt-[30px] bg-red-100 text-red-950 border-red-400 border-2 rounded-xl px-[16px] py-[16px] text-sm'>
                        <p>{actionData.error.auth_error}</p>
                    </div>
                )}
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
                            minLength={3}
                            maxLength={20}
                            pattern='^[a-zA-Z0-9_]+$'
                            title='Username can only include letters, numbers, and underscores. And must be between 3 and 20 characters'
                            className='border border-black/50 rounded-md py-[6px] px-[6px]'
                            required
                        />
                        {actionData?.error?.username && (
                            <div className='mt-[30px] bg-red-100 text-red-950 border-red-400 border-2 rounded-xl px-[16px] py-[16px] text-sm'>
                                <p>{actionData.error.username}</p>
                            </div>
                        )}
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
                            minLength={8}
                            maxLength={100}
                            required
                        />
                        {actionData?.error?.password && (
                            <div className='mt-[30px] bg-red-100 text-red-950 border-red-400 border-2 rounded-xl px-[16px] py-[16px] text-sm'>
                                <p>{actionData.error.password}</p>
                            </div>
                        )}
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
