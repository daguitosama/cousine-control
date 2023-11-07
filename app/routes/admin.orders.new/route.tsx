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
import { Create_Order_Operation_Result, create_order } from "./create_order.server";

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
export default function NewOrderRoute() {
    const { products } = useLoaderData<typeof loader>();
    const [mode, set_mode] = useState<"normal" | "adding-products">("normal");
    const [product_lines, set_product_lines] = useState<Map<string, ProductLine>>(new Map());
    //
    const non_selected_products = products.filter((product) => {
        const product_in_product_line = product_lines.get(product.id);
        return !product_in_product_line;
    });
    //
    function add_products_to_selection(products: Product[]) {
        var new_product_lines = products.map(map_product_to_product_line);
        set_product_lines((prev_product_lines_map) => {
            new_product_lines.forEach((new_product_line) => {
                prev_product_lines_map.set(new_product_line.id, new_product_line);
            });
            return new Map(prev_product_lines_map);
        });
    }
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

            <CreateOrder product_lines={product_lines} />
        </div>
    );
}

function CreateOrder({ product_lines }: { product_lines: Map<string, ProductLine> }) {
    const [order_name, set_order_name] = useState<string>("Mesa 1");
    const [final_product_lines, set_final_product_lines] = useState<Map<string, ProductLine>>(
        new Map()
    );
    const fetcher = useFetcher();
    async function submit() {
        fetcher.submit(
            {
                order_name,
                product_lines: [...final_product_lines.values()],
            },
            {
                method: "post",
                action: "/admin/orders/new",
                encType: "application/json",
            }
        );
    }

    const op_result: Create_Order_Operation_Result | undefined = fetcher.data;
    const is_loading = fetcher.state != "idle";
    return (
        <div className='grid gap-8'>
            {
                // @ts-ignore
                op_result?.err && (
                    <div className='rounded-lg p-4  border border-black'>
                        <p className='font-medium text-lg'>Error</p>
                        // @ts-ignore
                        <p className='text-sm'>{op_result?.err}</p>
                    </div>
                )
            }
            <div className='py-5 grid gap-5'>
                <h2 className='text-lg font-medium'>Name</h2>
                <div className='grid  grid-cols-2 gap-2 max-w-[400px]'>
                    <label
                        htmlFor='order-name-input'
                        className='sr-only'
                    >
                        Order Name{" "}
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
                    {[...product_lines.values()].map((product_line) => {
                        const input_id = `pl:${product_line.id}:quantity-input`;
                        return (
                            <div
                                key={`pl:${product_line.id}`}
                                className='grid  grid-cols-2 gap-2 max-w-[400px]'
                            >
                                <label htmlFor={input_id}>{product_line.product.name}</label>
                                <input
                                    type='number'
                                    name=''
                                    id={input_id}
                                    min={1}
                                    className='border border-black px-[4px] py-[2px] rounded-md'
                                    onChange={(evt) => {
                                        var new_product_line = {
                                            ...product_line,
                                            quantity: parseInt(evt.currentTarget.value),
                                        };
                                        set_final_product_lines((prev_pl_map) => {
                                            prev_pl_map.set(product_line.id, new_product_line);
                                            return new Map(prev_pl_map);
                                        });
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <Button
                    onClick={submit}
                    disabled={is_loading}
                >
                    <span>{is_loading ? "Creating" : "Create"}</span>
                </Button>
            </div>

            <div className='mt-[50px] bg-slate-100 rounded-lg p-4 text-xs overflow-scroll border border-slate-200'>
                <pre>
                    <code>
                        {JSON.stringify(
                            {
                                op_result,
                                order_name,
                                final_product_lines: [...final_product_lines.values()],
                            },
                            null,
                            2
                        )}
                    </code>
                </pre>
            </div>
        </div>
    );
}

type ActionData = {
    result: Awaited<ReturnType<typeof create_order>>;
};

export async function action({ request }: DataFunctionArgs) {
    const data = await request.json();
    const create_order_op = await create_order(data);
    if (create_order_op.err) {
        return json<ActionData>({
            result: create_order_op,
        });
    }
    return redirect("/admin/orders/");
}
