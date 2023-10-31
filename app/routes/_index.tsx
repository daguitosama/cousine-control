import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { new_timer } from "~/util/misc.server";
import type { HeadersFunction } from "@remix-run/node"; // or cloudflare/deno

type User = {
    id: string;
    username: string;
    hashed_password: string;
    user_role: string;
};
type LoaderData = {
    users: User[];
};

export async function loader({ request, context: { sql } }: LoaderFunctionArgs) {
    const timer = new_timer();
    const users = await sql<User[]>`
      select * from users;
    `;
    return json<LoaderData>(
        {
            users,
        },
        {
            headers: {
                "Server-Timing": `get_users;desc="(db) Get Users";dur=${timer.delta()}`,
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
        "X-Stretchy-Pants": "its for fun",
        "Server-Timing": loaderHeaders.get("Server-Timing") as string,
    };
};

export default function Index() {
    const { users } = useLoaderData<LoaderData>();
    return (
        <div className='max-w-md mx-auto px-[30px] '>
            <h1 className='text-5xl mt-[60px]'>App users</h1>
            <ul className='mt-[30px] grid grid-cols-1 gap-[30px]'>
                {users.map((user) => {
                    return (
                        <li
                            key={user.id}
                            className=' border border-gray-400 rounded-md p-4 grid grid-cols-1 gap-[12px]'
                        >
                            <div>
                                <p className='pr-4 text-gray-500'>id:</p>
                                <p>{user.id}</p>
                            </div>
                            <div>
                                <p className='pr-4 text-gray-500'>username:</p>
                                <p> {user.username}</p>
                            </div>
                            <div>
                                <p className='pr-4 text-gray-500'>role: </p>
                                <p>{user.user_role}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export const meta: MetaFunction = () => {
    return [
        { title: "Cousine Control" },
        { name: "description", content: "Welcome to Cousine Control!" },
    ];
};
