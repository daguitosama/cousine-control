import { db } from "~/util/db.server";
import z from "zod";
type Create_Order_Operation_Success = {
    ok: true;
    err: null;
};
type Create_Order_Operation_Error = {
    ok: false;
    err: Error;
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
    order_name: z.string(),
    product_lines: z.array(ProductLineSchema),
});

type SimpleOrder = {
    id: string;
    order_name: string;
    closed: boolean;
};
export async function create_order(data: unknown): Promise<Create_Order_Operation_Result> {
    const sql = db();
    try {
        const order = OrderSchema.parse(data);
        const orderRows = await sql<SimpleOrder[]>`
        insert into orders (
            order_name
        )
        values (
            ${order.order_name}
        ) returning *
        `;

        if (!orderRows.length) {
            throw new Error("Simple order failed to be created");
        }

        const order_id = orderRows[0].id;

        const product_order_updates = order.product_lines.map((product_line) => {
            return sql`
            insert into orders_products ( 
                order_id,
                product_id,
                quantity
            ) values (
                ${order_id},
                ${product_line.product.id},
                ${product_line.quantity}
            );
        `;
        });

        await Promise.all(product_order_updates);

        return { ok: true, err: null };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            err:
                error instanceof Error
                    ? error
                    : new Error("unknown error while creating the order"),
        };
    }
}
