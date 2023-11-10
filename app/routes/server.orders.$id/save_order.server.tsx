import { db } from "~/util/db.server";
import z from "zod";
import { Product } from "~/types/product";
import { ProductLine } from "./db.server";
type Create_Order_Operation_Success = {
    ok: true;
    err: null;
};
export type Create_Order_Operation_Error = {
    ok: false;
    err: { item: string; cause: string }; // todo: this can't be a JS Error, since get's loss on serialization
    // fix it by using something like {item: string, cause : string}
};
export type Create_Order_Operation_Result =
    | Create_Order_Operation_Success
    | Create_Order_Operation_Error;
const ProductLineSchema = z.object({
    id: z.string(),
    product: z.object({
        id: z.string(),
        name: z.string(),
        price: z.string(),
        quantity: z.number(),
    }),
    quantity: z.number(),
});
const OrderSchema = z.object({
    order_id: z.string(),
    order_name: z.string(),
    product_lines: z.array(ProductLineSchema),
});

type SimpleOrder = {
    id: string;
    order_name: string;
    closed: boolean;
};
export async function save_order(data: unknown): Promise<Create_Order_Operation_Result> {
    const sql = db();
    // return { err: new Error("Kaboom"), ok: false };
    try {
        const order = OrderSchema.parse(data);
        console.log("(create_order) Parsed Order:");
        console.log(JSON.stringify({ order }, null, 2));
        console.log("----------------------------------\n\r");

        // update name
        const orderRows = await sql`
            update orders set order_name = ${order.order_name} where orders.id = '${order.order_id}';
        `;

        if (!orderRows.length) {
            throw new Error("Failed to update the order name");
        }
        // update product lines

        ////  check availability

        const product_availability_checks = order.product_lines.map(async (product_line) => {
            const productRows = await sql<Product[]>`
                select * from products where id = ${product_line.product.id};
            `;

            if (!productRows.length) {
                throw new Error("Product not found");
            }

            if (productRows[0].quantity < product_line.quantity) {
                throw new AvailabilityError(
                    `${product_line.product.name} quantity is not enough to create the order `
                );
            }
        });

        await Promise.all(product_availability_checks);

        //// update all ready existing product lines
        const existing_product_lines_rows = await sql<String[]>`
        select ops.product_id as product_id from orders_products ops 
        where ops.order_id = '${order.order_id}' `;

        if (!existing_product_lines_rows.length) {
            throw new Error("Product lines search did not found");
        }

        // 🔥 👀 existing_product_lines_rows.map to update those product lines promises

        // for the rest of product lines non all ready created (if any)
        // create the respective references
        //// create new product lines
        const non_existing_product_lines: ProductLine[] = [];
        const product_order_inserts = non_existing_product_lines.map((product_line) => {
            return sql`
            insert into orders_products ( 
                order_id,
                product_id,
                quantity
            ) values (
                ${order.order_id},
                ${product_line.product.id},
                ${product_line.quantity}
            );
        `;
        });

        // await Promise.all(product_order_updates);

        return { ok: true, err: null };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            err:
                error instanceof Error
                    ? { item: error.name, cause: error.message }
                    : { item: "DB or Parsing", cause: "Something failed" },
        };
    }
}

class AvailabilityError extends Error {}
