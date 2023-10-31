import postgres from "postgres";
import { Product } from "~/types/product";
import { db } from "~/util/db.server";
import { new_timer } from "~/util/misc.server";

type SaveProductOpResult = {
    ok: string | null;
    err: string | null;
};
export async function save_product({
    name,
    quantity,
    price,
    sql,
}: {
    name: string;
    quantity: number;
    price: number;
    sql: postgres.Sql;
}): Promise<SaveProductOpResult> {
    try {
        const rows = await sql<Product[]>`
        insert into products (
            name,
            quantity,
            price
        ) values (
            ${name},
            ${quantity},
            ${price}
        )
    `;
        return { ok: "Product created successfully ", err: null };
    } catch (error) {
        if (!(error instanceof Error)) {
            return { ok: null, err: "Not Error instance error detected" };
        }
        return { ok: null, err: error.message };
    }
}

type GetProductsSuccess = {
    ok: { products: Product[]; time: number };
    err: null;
};
type GetProductsError = {
    ok: null;
    err: Error;
};

type GetProductsResult = GetProductsSuccess | GetProductsError;
export async function get_products(): Promise<GetProductsResult> {
    var sql = db();
    const timer = new_timer();
    try {
        const products = await sql<Product[]>`select * from products`;
        return { ok: { products, time: timer.delta() }, err: null };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return { ok: null, err: error };
        }
        return { ok: null, err: new Error("Unknown error") };
    }
}
