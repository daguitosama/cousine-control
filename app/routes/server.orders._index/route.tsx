import { HeadersFunction, json } from "@remix-run/server-runtime";
import { redirect_if_not_authorized } from "~/util/auth.server";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { Order, get_orders } from "./orders.server";
import { OrdersScreenDialog, add_order_dialog_link, parse_dialog } from "./dialogs.server";
import { AppHeader } from "~/components/app/AppHeader";
import { ButtonLink } from "~/components/ui/ButtonLink";
import { isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
import { Product } from "~/types/product";
import { get_products } from "../admin.products/db";
import { OrdersTable } from "./OrdersTable";

type LoaderData = {
    dialog: OrdersScreenDialog;
    orders: Order[];
    add_order_dialog_link: string;
    products: Product[];
};
export async function loader({ request }: LoaderFunctionArgs) {
    // throw new Error("Kaboom!");
    const redirection = await redirect_if_not_authorized(request, ["server", "admin"]);
    if (redirection) {
        return redirection;
    }
    const [get_products_op, get_orders_op] = await Promise.all([get_products(), get_orders()]);
    //
    if (get_products_op.err) {
        throw get_products_op.err;
    }
    if (get_orders_op.err) {
        throw get_products_op.err;
    }

    return json<LoaderData>(
        {
            // dialog_add_product_link: add_products_dialog_link(),
            dialog: parse_dialog(request),
            // products: get_products_op.ok.products,
            orders: get_orders_op.ok.orders,
            add_order_dialog_link: add_order_dialog_link(),
            products: get_products_op.ok.products,
        },
        {
            headers: {
                "Server-Timing": `get_products;desc="(db) Get Products";dur=${get_products_op.ok.time},get_orders;desc="(db) Get Orders";dur=${get_orders_op.ok.time},`,
            },
        }
    );
}

export const DIALOGS_ACTIONS = {
    add_order: "add-order",
};

export const headers: HeadersFunction = ({
    actionHeaders,
    loaderHeaders,
    parentHeaders,
    errorHeaders,
}) => {
    return {
        "Server-Timing": [
            loaderHeaders.get("Server-Timing") as string,
            parentHeaders.get("Server-Timing") as string,
        ].join(","),
    };
};

export default function OrdersRoute() {
    const loaderData = useLoaderData<typeof loader>();
    const is_dialog_open = loaderData.dialog != "idle";

    return (
        <div>
            <AppHeader>
                <h1 className='font-bold text-xl leading-none'>Orders</h1>
                <ButtonLink
                    to='/server/orders/new'
                    variant='primary'
                >
                    Add Order
                </ButtonLink>

                <OrdersScreenDialogs
                    dialog={loaderData.dialog}
                    open={is_dialog_open}
                />
            </AppHeader>
            <OrdersTable orders={loaderData.orders} />
        </div>
    );
}

function OrdersScreenDialogs({ open, dialog }: { dialog: OrdersScreenDialog; open: boolean }) {
    const loaderData = useLoaderData<typeof loader>();
    if (dialog == "idle") {
        return null;
    }
}

export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div className='w-full overflow-scroll'>
                <h1>
                    {error.status} {error.statusText}
                </h1>
                <p>{error.data}</p>
            </div>
        );
    } else if (error instanceof Error) {
        return (
            <div className='mt-[40px] w-full  p-[30px] rounded-lg border-red-400 bg-red-100'>
                <h1 className='text-2xl'>Error</h1>
                <p className='mt-[20px] text-sm'>{error.message}</p>
                <p className='mt-[20px] text-sm'>The stack trace is:</p>
                <pre className='mt-[20px] text-sm overflow-scroll'>{error.stack}</pre>
            </div>
        );
    } else {
        return <h1>Unknown Error</h1>;
    }
}
