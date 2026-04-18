const mysql = require("mysql12");
//muista omat tunnukset tähä
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "metro_pizza",
});

module.exports = pool.promise();
