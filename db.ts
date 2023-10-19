import postgres from "postgres";

function new_db_connection(db_url: string): postgres.Sql {
    return postgres(db_url, { onclose: () => console.log("----> db connection close") });
}

export default new_db_connection;
