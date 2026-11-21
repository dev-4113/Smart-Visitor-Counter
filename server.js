
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// SERVER STATUS
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "VisitFlow Server is Running"
    });
});

// API HEALTH CHECK
app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "Backend Connected Successfully"
    });
});


 // REGISTER VISITOR + ACTIVITY LOG
app.post("/api/visitors", (req, res) => {

    const visitorId = "VIS-" + Date.now();

    const visitorSQL = `
        INSERT INTO visitors
        (visitor_id, visit_date, visit_time, source, status)
        VALUES (?, CURDATE(), CURTIME(), 'Website', 'Registered')
    `;

    db.query(visitorSQL, [visitorId], (err, result) => {

        if (err) {
            console.error("Visitor Registration Error:", err.message);

            return res.status(500).json({
                status: "error",
                message: "Visitor registration failed"
            });
        }

        const activitySQL = `
            INSERT INTO visitor_activity
            (visitor_id, activity, activity_time)
            VALUES (?, ?, NOW())
        `;

        db.query(
            activitySQL,
            [visitorId, "New visitor registered"],
            (activityError) => {

                if (activityError) {
                    console.error(
                        "Activity Logging Error:",
                        activityError.message
                    );

                    return res.status(500).json({
                        status: "error",
                        message: "Visitor registered, but activity logging failed",
                        visitor_id: visitorId
                    });
                }

                console.log("Visitor Registered:", visitorId);
                console.log("Activity Logged Successfully!");

                res.status(201).json({
                    status: "success",
                    message: "Visitor registered and activity logged",
                    visitor_id: visitorId
                });

            }
        );

    });

});
// GET ALL VISITORS
app.get("/api/visitors", (req, res) => {
    const sql = `
        SELECT *
        FROM visitors
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Visitors Error:", err.message);

            return res.status(500).json({
                status: "error",
                message: "Unable to fetch visitors"
            });
        }

        res.json({
            status: "success",
            total: results.length,
            visitors: results
        });
    });
});

// GET RECENT VISITOR ACTIVITY
app.get("/api/activities", (req, res) => {
    const sql = `
        SELECT visitor_id, activity, activity_time
        FROM visitor_activity
        ORDER BY id DESC
        LIMIT 50
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Activities Error:", err.message);
            return res.status(500).json({
                status: "error",
                message: "Unable to fetch visitor activities"
            });
        }

        res.json({
            status: "success",
            total: results.length,
            activities: results
        });
    });
});

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            status: "error",
            message: "Email and password are required"
        });
    }

    const sql = `
        SELECT id, email, password_hash
        FROM admins
        WHERE email = ?
        LIMIT 1
    `;

    db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
        if (err) {
            console.error("Admin Login Database Error:", err.message);

            return res.status(500).json({
                status: "error",
                message: "Login service unavailable"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password"
            });
        }

        try {
            const admin = results[0];

            const passwordMatch = await bcrypt.compare(
                password,
                admin.password_hash
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    status: "error",
                    message: "Invalid email or password"
                });
            }

            if (!process.env.JWT_SECRET) {
                return res.status(500).json({
                    status: "error",
                    message: "Authentication configuration missing"
                });
            }

            const token = jwt.sign(
                {
                    adminId: admin.id,
                    email: admin.email
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "2h"
                }
            );

            res.json({
                status: "success",
                message: "Admin login successful",
                token,
                admin: {
                    id: admin.id,
                    email: admin.email
                }
            });

        } catch (error) {
            console.error("Login Error:", error.message);

            res.status(500).json({
                status: "error",
                message: "Unable to process login"
            });
        }
    });
});

// AUTHENTICATION MIDDLEWARE
function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "error",
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        req.admin = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired login session"
        });
    }
}

// PROTECTED ADMIN PROFILE
app.get("/api/admin/profile", verifyAdmin, (req, res) => {
    res.json({
        status: "success",
        message: "Admin authenticated",
        admin: req.admin
    });
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`VisitFlow Server running on port ${PORT}`);
});
