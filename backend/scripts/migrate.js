const pool = require("../config/db");
async function run() {
  const queries = [
    `ALTER TABLE job_cards ADD COLUMN exterior_damage TEXT NULL`,
    `ALTER TABLE job_cards ADD COLUMN qc_status ENUM("pending","passed","rework_required") DEFAULT "pending"`,
    `ALTER TABLE job_cards ADD COLUMN qc_notes TEXT NULL`,
    `ALTER TABLE job_cards ADD COLUMN discount_requested DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE job_cards ADD COLUMN discount_approved TINYINT(1) DEFAULT 0`
  ];

  for (const q of queries) {
    try { await pool.query(q); } catch(err) { /* column exists */ }
  }
  console.log("Migration completed successfully");
  process.exit();
}
run();

