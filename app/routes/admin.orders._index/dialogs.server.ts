// // // // // //
export type OrdersScreenDialog = "idle" | "add-order";
function is_dialog(s: string): s is OrdersScreenDialog {
    return ["idle", "add-order"].includes(s);
}
export function parse_dialog(request: Request): OrdersScreenDialog {
    const url = new URL(request.url);
    const dialog = url.searchParams.get("dialog");
    if (!dialog || !is_dialog(dialog)) {
        return "idle";
    }
    return dialog;
}

// add products dialog
export function add_order_dialog_link() {
    const dialog_add_products_params = new URLSearchParams();
    dialog_add_products_params.set("dialog", "add-order");
    return `/admin/orders?${dialog_add_products_params.toString()}`;
}

// intent
type OrdersScreenIntent = "add-order" | "default";
// add order
function is_intent(s: string): s is OrdersScreenIntent {
    return ["add-products", "other-feature-not-made-yet"].includes(s);
}
export function parse_intent(formData: FormData): OrdersScreenIntent {
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
