const bcrypt = require("bcrypt");
const pool = require("../config/db");

async function keepOnlyManager() {
  const conn = await pool.getConnection();
  try {
    console.log("Cleaning non-manager users and transaction data...");
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    await conn.query("TRUNCATE TABLE task_assignments");
    await conn.query("TRUNCATE TABLE labor_logs");
    await conn.query("TRUNCATE TABLE job_parts");
    await conn.query("TRUNCATE TABLE requisitions");
    await conn.query("TRUNCATE TABLE invoice_items");
    await conn.query("TRUNCATE TABLE invoices");
    await conn.query("TRUNCATE TABLE payments");
    await conn.query("TRUNCATE TABLE vehicle_images");
    await conn.query("TRUNCATE TABLE job_tasks");
    await conn.query("TRUNCATE TABLE job_cards");
    await conn.query("TRUNCATE TABLE vehicles");
    await conn.query("TRUNCATE TABLE customers");
    await conn.query("TRUNCATE TABLE notifications");

    // Delete all users except manager
    await conn.query("DELETE FROM users WHERE email <> 'manager@pitstoppro.lk'");

    const passwordHash = await bcrypt.hash("Admin@1234", 10);
    const [managerExists] = await conn.query("SELECT id FROM users WHERE email = 'manager@pitstoppro.lk'");
    if (managerExists.length === 0) {
      await conn.query(
        "INSERT INTO users (id, full_name, email, password, role, phone, is_active) VALUES (1, 'Workshop Manager', 'manager@pitstoppro.lk', ?, 'manager', '0771234001', 1)",
        [passwordHash]
      );
    } else {
      await conn.query(
        "UPDATE users SET full_name = 'Workshop Manager', password = ?, role = 'manager', phone = '0771234001', is_active = 1 WHERE email = 'manager@pitstoppro.lk'",
        [passwordHash]
      );
    }

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    const [remainingUsers] = await conn.query("SELECT id, full_name, email, role, phone, is_active FROM users");
    console.log("Remaining users in database:", remainingUsers);
    console.log("SUCCESS: Only default manager account is present now!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

keepOnlyManager();
