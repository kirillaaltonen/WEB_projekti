import mysql from "mysql2";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "salasana",
  database: "metro_pizza",
});

export default pool.promise();
