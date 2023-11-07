import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/Button";
import { useState } from "react";
import clsx from "clsx";
import { Product } from "~/types/product";

export function AddProducts({
    open,
    products,
    onClose,
    addProductsToSelection,
}: {
    open: boolean;
    products: Product[];
    onClose: () => void;
    addProductsToSelection: (products: Product[]) => void;
}) {
    const [selected_products, set_selected_products] = useState<Map<string, Product>>(new Map());
    function handle_add_products() {
        addProductsToSelection([...selected_products.values()]);
        onClose();
    }
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
                            <p className='font-medium'>Add Products</p>
                            <button
                                onClick={onClose}
                                aria-label='Close Add Product Form'
                            >
                                <XMarkIcon className='w-5 h-5' />
                            </button>
                        </Dialog.Title>

                        <div className='grid gap-4 p-[30px]'>
                            <p className=' font-medium'>Select Products</p>
                            <ul className='grid grid-cols-3 gap-[10px]'>
                                {products.map((product) => {
                                    return (
                                        <div
                                            key={`product-selector:${product.id}`}
                                            className='p-2 rounded-lg border border-slate-400 flex items-center gap-2'
                                        >
                                            <input
                                                type='checkbox'
                                                id={`product:${product.id}`}
                                                value={product.name}
                                                onChange={(evt) => {
                                                    const was_selected = evt.target.checked;

                                                    if (was_selected) {
                                                        // add to products
                                                        set_selected_products((selection_map) => {
                                                            selection_map.set(product.id, product);
                                                            return new Map(selection_map);
                                                        });
                                                    } else {
                                                        // remove from products
                                                        set_selected_products((selection_map) => {
                                                            selection_map.delete(product.id);
                                                            return new Map(selection_map);
                                                        });
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

                        {/* controls */}
                        <div className='bg-slate-100 px-[30px] py-[20px] flex justify-end gap-[20px]'>
                            <button onClick={onClose}>Cancel</button>
                            <Button onClick={handle_add_products}>Add</Button>
                        </div>
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
