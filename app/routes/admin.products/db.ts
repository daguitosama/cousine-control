import postgres from "postgres";
import { Product } from "~/types/product";

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
