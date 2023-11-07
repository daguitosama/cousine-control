import { boolean } from "zod";
import { Product } from "~/types/product";
import { db } from "~/util/db.server";
import { new_timer } from "~/util/misc.server";

export type Order = {
    id: string;
    name: string;
    product_lines: ProductLine[];
    total: number;
    closed: boolean;
};

type SimpleOrder = {
    id: string;
    name: string;
    closed: boolean;
};

type Save_Order_Success = {
    ok: { done: true; time: number };
    err: null;
};

type Save_Order_Error = {
    ok: null;
    err: Error;
};

type Save_Order_Result = Save_Order_Success | Save_Order_Error;
type Product_in_Order = Omit<Product, "quantity">;
export type ProductLine = {
    id: string;
    product: Product_in_Order;
    quantity: number;
};
export async function save_order({
    order_name,
    product_lines,
}: {
    order_name: string;
    product_lines: ProductLine[];
}): Promise<Save_Order_Result> {
    const sql = db();
    const timer = new_timer();

    try {
        const simple_order_row = await sql<
            SimpleOrder[]
        >`insert into orders (order_name) values (${order_name}) returning *`;

        const create_orders_products_jobs = product_lines.map(async (product_line) => {
            return sql`insert into orders_products values(order_id, product_id, quantity) values (${simple_order_row[0].id}, ${product_line.product.id}, ${product_line.quantity})`;
        });

        await Promise.all(create_orders_products_jobs);

        return { ok: { done: true, time: timer.delta() }, err: null };
    } catch (error) {
        return { ok: null, err: error instanceof Error ? error : new Error("Unknown Error") };
    }
}

type OrdersProductsJoint = {
    // order
    order_id: string;
    order_name: string;
    order_closed: boolean;
    // product
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
};

type GetOrdersSuccess = {
    ok: { orders: Order[]; time: number };
    err: null;
};

type GetOrdersError = {
    ok: null;
    err: Error;
};

type GetOrdersResult = GetOrdersSuccess | GetOrdersError;
export async function get_orders(): Promise<GetOrdersResult> {
    // joint entities get reference
    // https://stackoverflow.com/questions/3395339/sql-how-do-i-query-a-many-to-many-relationship#3395372

    const sql = db();
    const timer = new_timer();
    try {
        const rows = await sql<OrdersProductsJoint[]>`
        SELECT O.ID AS ORDER_ID,
            O.ORDER_NAME,
            O.CLOSED AS ORDER_CLOSED,
            P.ID AS PRODUCT_ID,
            P.NAME AS PRODUCT_NAME,
            P.PRICE AS PRODUCT_PRICE,
            P.QUANTITY
        FROM ORDERS O
        JOIN ORDERS_PRODUCTS OP ON O.ID = OP.ORDER_ID
        JOIN PRODUCTS P ON OP.PRODUCT_ID = P.ID;
        `;

        const orders = parse_orders_products_joint(rows);

        return {
            ok: { orders, time: timer.delta() },
            err: null,
        };
    } catch (error) {
        console.error(error);
        return { ok: null, err: error instanceof Error ? error : new Error("Unknown message") };
    }
}

function parse_orders_products_joint(rows: OrdersProductsJoint[]): Order[] {
    const orders: Order[] = [];
    const orders_map: Map<string, Order> = new Map();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!orders_map.has(row.order_id)) {
            orders_map.set(row.order_id, order_from_current_orders_products_joint_row(row));
        } else {
            var tmp_order = orders_map.get(row.order_id);
            if (!tmp_order?.product_lines) {
                throw new Error("_temp order does not has product_lines");
            }
            var product_line = product_line_from_current_orders_products_joint_row(row);
            tmp_order.product_lines.push(product_line);
            tmp_order.total += product_line.product.price * product_line.quantity;
            orders_map.set(tmp_order.id, tmp_order);
        }
    }

    for (const [key, value] of orders_map) {
        orders.push(value);
    }

    return orders;
}

function order_from_current_orders_products_joint_row(row: OrdersProductsJoint): Order {
    return {
        id: row.order_id,
        closed: row.order_closed,
        name: row.order_name,
        product_lines: [
            {
                id: row.product_id,
                product: {
                    id: row.product_id,
                    name: row.product_name,
                    price: row.product_price,
                },
                quantity: row.quantity,
            },
        ],
        total: row.product_price * row.quantity,
    };
}

function product_line_from_current_orders_products_joint_row(
    row: OrdersProductsJoint
): ProductLine {
    return {
        id: row.product_id,
        product: {
            id: row.product_id,
            name: row.product_name,
            price: row.product_price,
        },
        quantity: row.quantity,
    };
}

/*

- order-id-1   | ...row data
- order-id-1   | ...row data
- order-id-1   | ...row data
- order-id-1   | ...row data

--------------------------------                    orders []
{                                                   examined orders (ids) []
    id: order-id-1,                                 for every row 
    total: 2300,                                        if not in examined orders
    product_lines: [                                        add id to examined orders 
        {                                                   orders push new-order from current row
            id: product-id-0,                           else
            price: 100,                                     add product-line from current row to that order
            quantity: 23                                
        }
    ]
}

*/
