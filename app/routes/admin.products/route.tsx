import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { redirect_if_not_authorized } from "~/util/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const redirection = await redirect_if_not_authorized(request, "admin");
    if (redirection) {
        return redirection;
    }

    // /products GET logic
    return json({});
}

export default function ProductsRoute() {
    return <h1>Products</h1>;
}
