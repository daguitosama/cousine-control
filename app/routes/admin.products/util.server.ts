// // // // // //
// Dialog features
//
// The product screen can have several dialogs
// Thinking in one or none at a time
// so they are modeled as a state machine
// where every state is a dialog, or idle as none

import { request } from "express";

// // // // // //
export type ProductsScreenDialog = "idle" | "add-product";
function is_dialog(s: string): s is ProductsScreenDialog {
    return ["idle", "add-product"].includes(s);
}
export function parse_dialog(request: Request): ProductsScreenDialog {
    const url = new URL(request.url);
    const dialog = url.searchParams.get("dialog");
    if (!dialog || !is_dialog(dialog)) {
        return "idle";
    }
    return dialog;
}

// add products dialog
export function add_products_dialog_link() {
    const dialog_add_products_params = new URLSearchParams();
    dialog_add_products_params.set("dialog", "add-product");
    return `/admin/products?${dialog_add_products_params.toString()}`;
}

// intent
type ProductScreenIntent = "add-products" | "default";
// add products
function is_intent(s: string): s is ProductScreenIntent {
    return ["add-products", "other-feature-not-made-yet"].includes(s);
}
export function parse_intent(formData: FormData): ProductScreenIntent {
    const intent = formData.get("intent");
    const isFile = intent instanceof File;
    if (isFile) {
        return "default";
    }
    if (!intent || !is_intent(intent)) {
        return "default";
    }
    return intent;
}

type AddProductsParams = {
    name: string;
    quantity: number;
    price: number;
};
type GetAddProductsParamsResult = {
    ok: AddProductsParams | null;
    err: string | null;
};
export function get_add_product_params(formData: FormData): GetAddProductsParamsResult {
    const name = formData.get("name");
    const quantity = formData.get("quantity");
    const price = formData.get("price");
    if (!name || !quantity || !price) {
        return { ok: null, err: "Bad Input" };
    }
    if (name instanceof File || quantity instanceof File || price instanceof File) {
        return { ok: null, err: "Bad Input" };
    }

    console.log({ name, quantity, price });
    const _quantity = parseFloat(quantity);
    const _price = parseFloat(price);

    if (_quantity <= 0 || _price <= 0) {
        return { ok: null, err: "Bad Input" };
    }

    return { ok: { name, price: _price, quantity: _quantity }, err: null };
}
