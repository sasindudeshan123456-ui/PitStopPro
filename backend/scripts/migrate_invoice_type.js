/**
 * PitStopPro — Invoice Table Migration
 * Adds 'type' column and makes job_card_id nullable in invoices table
 * Run once: node backend/scripts/migrate_invoice_type.js
 */
const db = require("../config/db");

async function migrate() {
  console.log("🔧 Running invoice table migration...");
  const fixes = [
    // 1. Add 'type' column if not present
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type ENUM('workshop_service','direct_sale','store','appointment_advance') NULL DEFAULT NULL`,
    // 2. Make job_card_id nullable (appointment invoices don't have a job card)
    `ALTER TABLE invoices MODIFY COLUMN job_card_id INT NULL`,
  ];

  for (const sql of fixes) {
    try {
      await db.query(sql);
      console.log("  ✓", sql.slice(0, 60) + "...");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME" || e.message.includes("Duplicate column")) {
        console.log("  ℹ Column already exists, skipping.");
      } else {
        console.error("  ✗ Error:", e.message);
      }
    }
  }

  // 3. Tag existing workshop invoices (those with job_card_id)
  try {
    await db.query("UPDATE invoices SET type = 'workshop_service' WHERE job_card_id IS NOT NULL AND type IS NULL");
    console.log("  ✓ Tagged existing workshop invoices.");
  } catch (e) {
    console.error("  ✗ Could not tag existing invoices:", e.message);
  }

  console.log("✅ Migration complete!");
  process.exit(0);
}

migrate();
