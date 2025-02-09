import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "http://127.0.0.1:5500" }));
app.use(express.json());

// ✅ MySQL Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "home_storage_db",
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10
});

// ✅ Check database connection
db.getConnection()
    .then(connection => {
        console.log("✅ Connected to MySQL database.");
        connection.release();
    })
    .catch(err => {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    });

// ✅ Middleware: Log requests for debugging
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// ✅ Dynamic route handler
async function handleRoute(req, res, tableName) {
    try {
        let results;
        if (req.method === "GET") {
            [results] = await db.execute(`SELECT * FROM ${tableName}`);
        } else if (req.method === "POST") {
            const { name, quantity } = req.body;

            if (!name || name.trim() === "") {
                return res.status(400).json({ success: false, error: "Name is required." });
            }
            if (!quantity || isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ success: false, error: "Quantity must be a positive number." });
            }

            [results] = await db.execute(
                `INSERT INTO ${tableName} (name, quantity) VALUES (?, ?)`,
                [name.trim(), quantity]
            );
        } else if (req.method === "DELETE") {
            const { id } = req.params;

            const [checkResult] = await db.execute(`SELECT 1 FROM ${tableName} WHERE id = ?`, [id]);
            if (checkResult.length === 0) {
                return res.status(404).json({ success: false, error: "Item not found." });
            }

            [results] = await db.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        } else {
            return res.status(405).json({ success: false, error: "Method not allowed" });
        }
        res.json({ success: true, data: results || null });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
}

// ✅ Routes for groceries, monthlies, and electrical
const routes = ["groceries", "monthlies", "electrical"];
routes.forEach(route => {
    app.get(`/${route}`, (req, res) => handleRoute(req, res, route));
    app.post(`/${route}`, (req, res) => handleRoute(req, res, route));
    app.delete(`/${route}/:id`, (req, res) => handleRoute(req, res, route));
});

// ✅ Routes for money usage
app.get("/money", async (req, res) => {
    try {
        const [results] = await db.execute("SELECT * FROM money_usage");
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/money", async (req, res) => {
    try {
        const { item, cost } = req.body;

        if (!item || item.trim() === "") {
            return res.status(400).json({ success: false, error: "Item is required." });
        }
        if (!cost || isNaN(cost) || cost <= 0) {
            return res.status(400).json({ success: false, error: "Cost must be a positive number." });
        }

        const [results] = await db.execute(
            "INSERT INTO money_usage (item, cost) VALUES (?, ?)",
            [item.trim(), cost]
        );
        res.json({ success: true, message: "Expense added", id: results.insertId });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete("/money/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [checkResult] = await db.execute(`SELECT 1 FROM money_usage WHERE id = ?`, [id]);
        if (checkResult.length === 0) {
            return res.status(404).json({ success: false, error: "Expense not found." });
        }

        await db.execute(`DELETE FROM money_usage WHERE id = ?`, [id]);
        res.json({ success: true, message: "Expense deleted" });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
