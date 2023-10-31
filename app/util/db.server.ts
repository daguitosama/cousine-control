import postgres from "postgres";
import env from "~/util/env.server";

// function new_db_connection(db_url: string): postgres.Sql {
//     return postgres(db_url, { onclose: () => console.log("----> db connection close") });
// }

// export default new_db_connection;

var _db: postgres.Sql | null = null;

export function db() {
    if (_db) {
        return _db;
    }

    _db = postgres(env().DB_URL);
    return _db;
}
