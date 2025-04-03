const bcrypt = require("bcryptjs");
const db = require("./config/db");

const email = "admin@gmail.com";
const password = "admin123"; // Change password if needed

const hashedPassword = bcrypt.hashSync(password, 10);

db.query("INSERT INTO admin (email, password) VALUES (?, ?)", [email, hashedPassword], (err, result) => {
    if (err) {
        console.error("❌ Error inserting admin:", err.message);
    } else {
        console.log("✅ Admin user created successfully!");
    }
    process.exit();
});
