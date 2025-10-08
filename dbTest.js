const mysql = require("mysql2/promise");

const testDB = async () => {
    try {
        // Connect to MySQL database
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",          // default XAMPP user
            password: "",          // default is empty
            database: "chat_app",   // your database name
            port: 3307             // default XAMPP port
        });

        console.log("✅ Connected to MySQL database successfully!");

        // Simple test query
        const [rows] = await connection.execute("SELECT NOW() AS `current_time`");
console.log("Database response:", rows);


        // Close the connection
        await connection.end();
    } catch (error) {
        console.error("❌ Database connection failed:", error);
    }
};

// Run the test
testDB();
