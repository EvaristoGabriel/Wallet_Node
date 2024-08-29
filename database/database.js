import pkg from "pg";

const {Pool} = pkg;

const db = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'financas',
    password: '1234',
    port: 5432,
})

// db.query("SELECT * FROM fiis").then((result) =>console.log(result));

export { db };
