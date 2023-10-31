import type {
    DataFunctionArgs,
    HeadersFunction,
    LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/node";
import { redirect_if_not_authorized } from "~/util/auth.server";
import { ButtonLink, ButtonLinkControl } from "~/components/ui/ButtonLink";
import { Button } from "~/components/ui/Button";
import {
    ProductsScreenDialog,
    add_products_dialog_link,
    get_add_product_params,
    parse_dialog,
    parse_intent,
} from "./util.server";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { get_products, save_product } from "./db";
import { Product } from "~/types/product";

type LoaderData = {
    dialog_add_product_link: string;
    dialog: ProductsScreenDialog;
    products: Product[];
};
const DIALOGS_ACTIONS = {
    add_products: "add-products",
};

export async function loader({ request }: LoaderFunctionArgs) {
    const redirection = await redirect_if_not_authorized(request, "admin");
    if (redirection) {
        return redirection;
    }
    const get_products_op = await get_products();
    //
    if (get_products_op.err) {
        throw get_products_op.err;
    }

    // /products GET logic
    return json<LoaderData>(
        {
            dialog_add_product_link: add_products_dialog_link(),
            dialog: parse_dialog(request),
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

type ActionData = {
    operation_result: {
        ok: string | null;
        err: string | null;
    };
};

export async function action({ request, context }: DataFunctionArgs) {
    //
    const formData = await request.formData();
    //
    const intent = parse_intent(formData);
    //
    switch (intent) {
        case "default":
            return { ok: "Default Case handled", err: null };
        case "add-products":
            const get_product_from_form_op = get_add_product_params(formData);
            if (get_product_from_form_op.err || !get_product_from_form_op.ok) {
                return { ok: null, err: get_product_from_form_op.err };
            }

            const save_product_op = await save_product({
                name: get_product_from_form_op.ok.name,
                quantity: get_product_from_form_op.ok.quantity,
                price: get_product_from_form_op.ok.price,
                sql: context.sql,
            });
            if (save_product_op.ok) {
                return redirect("/admin/products");
            } else {
                return { ok: null, err: save_product_op.err };
            }
        default: {
            return { ok: "Default Case handled", err: null };
        }
    }
}

export default function ProductsRoute() {
    const loaderData = useLoaderData<typeof loader>();
    const is_dialog_open = loaderData.dialog != "idle";

    return (
        <div>
            <AppHeader>
                <h1 className='font-bold text-xl leading-none'>Products</h1>
                <ButtonLink
                    to={loaderData.dialog_add_product_link}
                    variant='primary'
                >
                    Add Products
                </ButtonLink>
                <ProductScreenDialog
                    dialog={loaderData.dialog}
                    open={is_dialog_open}
                />
            </AppHeader>
        </div>
    );
}

function ProductScreenDialog({ open, dialog }: { dialog: ProductsScreenDialog; open: boolean }) {
    if (dialog == "idle") {
        return null;
    }

    if (dialog == "add-product") {
        return <AddProduct open={open} />;
    }
}

function AddProduct({ open }: { open: boolean }) {
    const fetcher = useFetcher();
    return (
        <Dialog
            open={open}
            onClose={() => {}}
        >
            {/* overlay */}
            <div
                className='fixed inset-0 bg-black/30'
                aria-hidden='true'
            />
            {/* dialog box */}
            <div className='fixed inset-0 w-screen overflow-y-auto p-4 '>
                <div className='bg-white rounded-xl overflow-hidden max-w-3xl mx-auto mt-[10vh]'>
                    <Dialog.Panel>
                        <Dialog.Title
                            className={
                                "bg-slate-100 flex items-center justify-between px-[30px] py-[20px]"
                            }
                        >
                            <p className='font-medium'>Add Product</p>
                            <ButtonLinkControl
                                to='/admin/products'
                                aria-label='Close Add Product Form'
                            >
                                <XMarkIcon className='w-5 h-5' />
                            </ButtonLinkControl>
                        </Dialog.Title>

                        <fetcher.Form
                            action=''
                            method='post'
                        >
                            {/* inputs */}
                            <div className='px-[30px] py-[20px] flex items-center justify-between'>
                                <input
                                    type='hidden'
                                    name='intent'
                                    value={DIALOGS_ACTIONS.add_products}
                                />

                                <div>
                                    <label
                                        htmlFor='inp:product-name'
                                        className='text-sm ml-2'
                                    >
                                        Product Name
                                    </label>
                                    <input
                                        type='text'
                                        name='name'
                                        id='inp:product-name'
                                        required
                                        className='mt-2 text-sm pl-2 p-2 rounded-md border-slate-400 border'
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor='inp:product-quantity'
                                        className='text-sm ml-2'
                                    >
                                        Quantity
                                    </label>
                                    <input
                                        type='number'
                                        name='quantity'
                                        id='inp:product-quantity'
                                        required
                                        className='mt-2 text-sm pl-2 p-2 rounded-md border-slate-400 border'
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor='inp:product-price'
                                        className='text-sm ml-2'
                                    >
                                        Price
                                    </label>
                                    <input
                                        type='number'
                                        name='price'
                                        id='inp:product-price'
                                        className='mt-2 text-sm pl-2 p-2 rounded-md border-slate-400 border'
                                    />
                                </div>
                            </div>

                            {/* controls */}
                            <div className='bg-slate-100 px-[30px] py-[20px] flex justify-end gap-[20px]'>
                                <ButtonLink
                                    variant='secondary'
                                    to='/admin/products'
                                >
                                    Cancel
                                </ButtonLink>
                                <Button>Save</Button>
                            </div>
                        </fetcher.Form>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}

function AppHeader({ ...props }) {
    return (
        <div className='w-full py-[20px] flex items-center justify-between'>{props.children}</div>
    );
}
