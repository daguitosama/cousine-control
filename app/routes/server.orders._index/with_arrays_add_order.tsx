import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFetcher } from "@remix-run/react";
import { ButtonLink, ButtonLinkControl } from "~/components/ui/ButtonLink";
import { DIALOGS_ACTIONS } from "./route";
import { Button } from "~/components/ui/Button";
import { useState } from "react";
import clsx from "clsx";
import { Product } from "~/types/product";
import { ProductLine } from "./orders.server";

function find_product_line({
    product_lines,
    product_line_id,
}: {
    product_lines: ProductLine[];
    product_line_id: string;
}) {
    const idx = product_lines.findIndex((pl) => pl.id == product_line_id);
    if (idx == -1) {
        return null;
    }
    return product_lines[idx];
}

function update_product_line({
    product_lines,
    to_update_product_line,
}: {
    product_lines: ProductLine[];
    to_update_product_line: ProductLine;
}) {
    const idx = product_lines.findIndex((pl) => pl.id == to_update_product_line.id);
    if (idx == -1) {
        return product_lines;
    }
    product_lines[idx] = to_update_product_line;
}

function remove_product_line({
    product_lines,
    to_remove_product_line,
}: {
    product_lines: ProductLine[];
    to_remove_product_line: ProductLine;
}) {
    const idx = product_lines.findIndex((pl) => pl.id == to_remove_product_line.id);
    if (idx == -1) {
        return product_lines;
    }
    product_lines = product_lines.slice(0, idx - 1).concat(product_lines.slice(idx + 1));
    return product_lines;
}

export function AddOrder({ open, products }: { open: boolean; products: Product[] }) {
    const fetcher = useFetcher();
    const [product_lines, set_product_lines] = useState<ProductLine[]>([]);

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
                            <p className='font-medium'>Add Order</p>
                            <ButtonLinkControl
                                to='/admin/orders'
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
                            <div className='px-[30px] py-[20px] grid gap-[40px]'>
                                <input
                                    type='hidden'
                                    name='intent'
                                    value={DIALOGS_ACTIONS.add_order}
                                />

                                <div className='grid gap-4'>
                                    <label
                                        htmlFor='inp:order-name'
                                        className='font-medium'
                                    >
                                        Order Name
                                    </label>
                                    <input
                                        type='text'
                                        name='order-name'
                                        id='inp:order-name'
                                        defaultValue={"Mesa 1"}
                                        required
                                        className='text-sm pl-2 p-2 rounded-md border-slate-400 border'
                                    />
                                </div>

                                <Separator />

                                <div className='grid gap-4'>
                                    <p className=' font-medium'>Select Products</p>
                                    <ul className='grid grid-cols-3 gap-[10px]'>
                                        {products.map((product) => {
                                            return (
                                                <div
                                                    key={product.id}
                                                    className='p-2 rounded-lg border border-slate-400 flex items-center gap-2'
                                                >
                                                    <input
                                                        type='checkbox'
                                                        id={`product:${product.id}`}
                                                        value={product.name}
                                                        onChange={(evt) => {
                                                            const was_selected = evt.target.checked;
                                                            console.log(
                                                                `(selected ) ${product.name} : `,
                                                                was_selected
                                                            );
                                                            const new_product_line: ProductLine = {
                                                                id: product.id,
                                                                product: product,
                                                                quantity: 1,
                                                            };
                                                            if (was_selected) {
                                                                set_product_lines(
                                                                    (current_product_lines) => {
                                                                        current_product_lines.push(
                                                                            new_product_line
                                                                        );
                                                                        return current_product_lines;
                                                                    }
                                                                );
                                                            } else {
                                                                set_product_lines(
                                                                    (current_product_lines) => {
                                                                        const to_remove_product_line =
                                                                            find_product_line({
                                                                                product_lines:
                                                                                    current_product_lines,
                                                                                product_line_id:
                                                                                    product.id,
                                                                            });
                                                                        if (
                                                                            !to_remove_product_line
                                                                        ) {
                                                                            return current_product_lines;
                                                                        }
                                                                        current_product_lines =
                                                                            remove_product_line({
                                                                                product_lines:
                                                                                    current_product_lines,
                                                                                to_remove_product_line:
                                                                                    to_remove_product_line,
                                                                            });
                                                                        return current_product_lines;
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`product:${product.id}`}>
                                                        {product.name}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </ul>
                                </div>

                                <Separator />

                                <div className='grid gap-4'>
                                    <p className='font-medium'> Quantities</p>
                                    <ul className='grid gap-6'>
                                        {[...product_lines.values()].map((product_line) => {
                                            const input_id = `product_line:${product_line.product.id}:quantity`;
                                            return (
                                                <li
                                                    key={product_line.product.id}
                                                    className=' grid grid-cols-4'
                                                >
                                                    <label htmlFor={input_id}>
                                                        {product_line.product.name}
                                                    </label>
                                                    <input
                                                        type='number'
                                                        name=''
                                                        id={input_id}
                                                        step={1}
                                                        min={1}
                                                        value={product_line.quantity}
                                                        onChange={(evt) => {
                                                            const new_quantity = parseInt(
                                                                evt.currentTarget.value
                                                            );

                                                            set_product_lines((pl_map) => {
                                                                pl_map.set(
                                                                    product_line.product.id,
                                                                    {
                                                                        product:
                                                                            product_line.product,
                                                                        quantity: new_quantity,
                                                                    }
                                                                );
                                                                return pl_map;
                                                            });
                                                        }}
                                                        className='border border-slate-400 rounded-md px-[4px] py-[2px]'
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>

                            {/* controls */}
                            <div className='bg-slate-100 px-[30px] py-[20px] flex justify-end gap-[20px]'>
                                <ButtonLink
                                    variant='secondary'
                                    to='/admin/orders'
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
function Separator() {
    return (
        <div
            className='w-full border-b border-b-slate-300'
            aria-hidden
        ></div>
    );
}
