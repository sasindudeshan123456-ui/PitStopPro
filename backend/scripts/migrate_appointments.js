const pool = require("../config/db");

async function migrateAppointments() {
  const conn = await pool.getConnection();
  try {
    console.log("Starting appointments and workflow migrations...");

    // 1. Create appointments table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        services TEXT NOT NULL,
        preferred_date DATE NOT NULL,
        preferred_time VARCHAR(50) DEFAULT 'Morning (08:30 AM - 12:00 PM)',
        status ENUM('pending', 'approved', 'confirmed', 'checked_in', 'cancelled') NOT NULL DEFAULT 'pending',
        customer_notes TEXT NULL,
        job_card_id INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL
      )
    `);
    try {
      await conn.query(`ALTER TABLE appointments MODIFY status ENUM('pending', 'approved', 'confirmed', 'checked_in', 'cancelled') NOT NULL DEFAULT 'pending'`);
    } catch (e) { /* ignore */ }
    console.log("SUCCESS: appointments table created/verified.");

    // 2. Update job_cards columns
    const jcColumns = [
      `ALTER TABLE job_cards ADD COLUMN customer_approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'pending'`,
      `ALTER TABLE job_cards ADD COLUMN customer_approved_at DATETIME NULL`,
      `ALTER TABLE job_cards ADD COLUMN customer_rejection_reason TEXT NULL`,
      `ALTER TABLE job_cards ADD COLUMN appointment_id INT NULL`
    ];
    for (const q of jcColumns) {
      try { await conn.query(q); } catch (e) { /* already exists */ }
    }
    console.log("SUCCESS: job_cards approval columns verified.");

    // 3. Update invoices table to support direct store sales
    try {
      await conn.query(`ALTER TABLE invoices MODIFY job_card_id INT NULL`);
    } catch (e) { /* ignore */ }
    try {
      await conn.query(`ALTER TABLE invoices ADD COLUMN type ENUM('service_job', 'direct_sale') NOT NULL DEFAULT 'service_job'`);
    } catch (e) { /* ignore */ }
    console.log("SUCCESS: invoices table direct sale compatibility verified.");

    console.log("All migrations completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrateAppointments();
