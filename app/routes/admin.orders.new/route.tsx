import { useState } from "react";
import { AppHeader } from "~/components/app/AppHeader";
import { Button } from "~/components/ui/Button";
import { redirect_if_not_authorized } from "~/util/auth.server";
import { get_products } from "../admin.products/db";

import {
    DataFunctionArgs,
    HeadersFunction,
    LoaderFunctionArgs,
    json,
    redirect,
} from "@remix-run/server-runtime";
import { Product } from "~/types/product";
import { AddProducts } from "./add_products";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { ProductLine } from "../admin.orders._index/orders.server";
import { Separator } from "~/components/ui/Separator";
import {
    Create_Order_Operation_Error,
    Create_Order_Operation_Result,
    create_order,
} from "./create_order.server";
import clsx from "clsx";

type LoaderData = {
    products: Product[];
};

export async function loader({ request }: LoaderFunctionArgs) {
    // throw new Error("Kaboom!");
    const redirection = await redirect_if_not_authorized(request, "admin");
    if (redirection) {
        return redirection;
    }
    const [get_products_op] = await Promise.all([get_products()]);
    //
    if (get_products_op.err) {
        throw get_products_op.err;
    }

    return json<LoaderData>(
        {
            products: get_products_op.ok.products,
        },
        {
            headers: {
                "Server-Timing": `get_products;desc="(db) Get Products";dur=${get_products_op.ok.time}`,
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
        "Server-Timing": [
            loaderHeaders.get("Server-Timing") as string,
            parentHeaders.get("Server-Timing") as string,
        ].join(","),
    };
};
function map_product_to_product_line(product: Product): ProductLine {
    return {
        id: product.id,
        product,
        quantity: 1,
    };
}
// 📜
export default function CreateOrderRoute() {
    const { products } = useLoaderData<typeof loader>();
    const [mode, set_mode] = useState<"normal" | "adding-products">("normal");
    const [product_lines, set_product_lines] = useState<Map<string, ProductLine>>(new Map());
    // data structure fns
    function delete_product_line(product_line: ProductLine) {
        set_product_lines((prev_pl_map) => {
            prev_pl_map.delete(product_line.id);
            return new Map(prev_pl_map);
        });
    }

    function update_product_line(id: string, product_line: ProductLine) {
        set_product_lines((prev_pl_map) => {
            prev_pl_map.set(id, product_line);
            return new Map(prev_pl_map);
        });
    }

    function add_products_to_selection(products: Product[]) {
        var new_product_lines = products.map(map_product_to_product_line);
        set_product_lines((prev_product_lines_map) => {
            new_product_lines.forEach((new_product_line) => {
                prev_product_lines_map.set(new_product_line.id, new_product_line);
            });
            return new Map(prev_product_lines_map);
        });
    }
    // end data structure fns

    const non_selected_products = products.filter((product) => {
        const product_in_product_line = product_lines.get(product.id);
        return !product_in_product_line;
    });

    return (
        <div>
            <AppHeader>
                <div className='flex items-center justify-between gap-4'>
                    <p className='opacity-70'>Orders</p>
                    <div className='h-6 w-[1px] border-l border-l-slate-300'></div>
                    <h1 className='font-bold  leading-none'>New Order</h1>
                </div>
                <Button
                    onClick={() => {
                        set_mode("adding-products");
                    }}
                >
                    Add Products
                </Button>
                <AddProducts
                    products={non_selected_products}
                    onClose={() => set_mode("normal")}
                    open={mode == "adding-products"}
                    addProductsToSelection={add_products_to_selection}
                />
            </AppHeader>

            <CreateOrder
                product_lines={product_lines}
                delete_product_line={delete_product_line}
                update_product_line={update_product_line}
            />
        </div>
    );
}

function CreateOrder({
    product_lines,
    delete_product_line,
    update_product_line,
}: {
    product_lines: Map<string, ProductLine>;
    delete_product_line: (product_line: ProductLine) => void;
    update_product_line: (id: string, product_line: ProductLine) => void;
}) {
    const [order_name, set_order_name] = useState<string>("Mesa 1");

    const fetcher = useFetcher();
    async function submit() {
        fetcher.submit(
            {
                order_name,
                product_lines: [...product_lines.values()],
            },
            {
                method: "post",
                action: "/admin/orders/new",
                encType: "application/json",
            }
        );
    }

    const is_loading = fetcher.state != "idle";
    const op_result: Create_Order_Operation_Result | undefined = fetcher.data;
    const is_error_time = !is_loading && op_result;
    return (
        <div>
            {is_error_time && (
                <div className='rounded-lg p-4  border border-red-300 bg-red-100'>
                    {/* <p className='font-medium text-lg'>Error</p> */}
                    {/* @ts-ignore */}
                    <p className='font-medium text-lg'>{op_result?.err?.item}</p>
                    {/* @ts-ignore */}
                    <p className='text-sm'>{op_result?.err?.cause}</p>
                </div>
            )}
            <div className='grid gap-8'>
                <div className='py-5 grid gap-5'>
                    <h2 className='text-lg font-medium'>Name</h2>
                    <div className='grid  grid-cols-2 gap-2 max-w-[400px]'>
                        <label
                            htmlFor='order-name-input'
                            className='sr-only'
                        >
                            Order Name
                        </label>
                        <input
                            type='text'
                            name=''
                            id='order-name-input'
                            value={order_name}
                            className='border border-black rounded-md px-[4px] py-[2px]'
                            onChange={(evt) => {
                                set_order_name(evt.currentTarget.value);
                            }}
                        />
                    </div>
                </div>
                <Separator />
                <div className='grid gap-5'>
                    <h2 className='text-lg font-medium'>Products</h2>
                    <div className=' grid gap-[20px]'>
                        {[...product_lines.values()].map((product_line, idx) => {
                            const input_id = `pl:${product_line.id}:quantity-input`;
                            return (
                                <div
                                    key={`pl:${product_line.id}`}
                                    className={clsx(
                                        "grid  grid-cols-4 gap-2  border-b border-slate-300 py-3",
                                        idx == 0 ? "border-t " : ""
                                    )}
                                >
                                    <label htmlFor={input_id}>{product_line.product.name}</label>
                                    <input
                                        type='number'
                                        name=''
                                        id={input_id}
                                        min={1}
                                        value={product_line.quantity}
                                        className='border border-black px-[4px] py-[2px] rounded-md'
                                        onChange={(evt) => {
                                            var new_product_line = {
                                                ...product_line,
                                                quantity: parseInt(evt.currentTarget.value),
                                            };

                                            update_product_line(product_line.id, new_product_line);
                                        }}
                                    />
                                    <div className=' flex items-center justify-center'>
                                        <button
                                            onClick={() => {
                                                delete_product_line(product_line);
                                            }}
                                            className='text-sm border-b border-black'
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <Separator />
                {product_lines.size > 0 && (
                    <div>
                        <Button
                            onClick={submit}
                            disabled={is_loading}
                        >
                            <span>{is_loading ? "Creating" : "Create"}</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

type ActionData = Create_Order_Operation_Error;

export async function action({ request }: DataFunctionArgs) {
    const data = await request.json();
    const create_order_op = await create_order(data);
    if (create_order_op.err) {
        return json<ActionData>(create_order_op);
    }
    return redirect("/admin/orders/");
}
