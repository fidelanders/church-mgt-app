var mysql = require("mysql");
var dotenv = require("dotenv");
dotenv.config();

const dbconnect = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  port: process.env.DBPORT,
  database: process.env.DBNAME,
  password: process.env.DBPASS,
});

dbconnect.connect((err) =>{
  if (err) throw err;
  console.log("Database Connected!");
  
});

module.exports = dbconnect;
