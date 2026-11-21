
const readline = require("readline");
const bcrypt = require("bcryptjs");
const db = require("./db");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter Admin Email: ", (email) => {
    rl.question("Enter Admin Password: ", async (password) => {

        email = email.trim().toLowerCase();

        if (!email || password.length < 8) {
            console.log("Email is required and password must have at least 8 characters.");
            db.end();
            rl.close();
            return;
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 12);

            const sql = `
                INSERT INTO admins (email, password_hash)
                VALUES (?, ?)
            `;

            db.query(sql, [email, hashedPassword], (err, result) => {

                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        console.log("This admin email already exists.");
                    } else {
                        console.log("Admin creation failed:", err.message);
                    }
                } else {
                    console.log("Admin account created successfully!");
                    console.log("Admin ID:", result.insertId);
                }

                db.end();
                rl.close();
            });

        } catch (error) {
            console.log("Error:", error.message);
            db.end();
            rl.close();
        }
    });
});
