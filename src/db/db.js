const mysql = require("mysql2/promise");

const dbconnection = async () => {
    try {
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "chat_app",
            port: 3307,
        });
        console.log("✅ Connected to MySQL database successfully!");
        return connection;
    } catch (error) {
        console.error("❌ Database connection failed:", error);
    }
};

module.exports = dbconnection;
