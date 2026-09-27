const db = require("../config/db");

async function purgeCancelled() {
  try {
    const [jobs] = await db.query(
      "SELECT id FROM job_cards WHERE status = 'cancelled' OR approval_status = 'rejected' OR customer_approval_status = 'rejected'"
    );
    console.log(`Found ${jobs.length} cancelled/rejected job cards to purge.`);

    for (const j of jobs) {
      const id = j.id;
      try {
        await db.query("DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE job_card_id = ?)", [id]);
        await db.query("DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE job_card_id = ?)", [id]);
        await db.query("DELETE FROM invoices WHERE job_card_id = ?", [id]);
        await db.query("DELETE FROM labor_logs WHERE task_id IN (SELECT id FROM job_tasks WHERE job_card_id = ?)", [id]);
        await db.query("DELETE FROM task_assignments WHERE task_id IN (SELECT id FROM job_tasks WHERE job_card_id = ?)", [id]);
        await db.query("DELETE FROM job_tasks WHERE job_card_id = ?", [id]);
        await db.query("DELETE FROM requisitions WHERE job_card_id = ?", [id]);
        await db.query("DELETE FROM job_parts WHERE job_card_id = ?", [id]);
        await db.query("DELETE FROM vehicle_images WHERE job_card_id = ?", [id]);
        await db.query("DELETE FROM notifications WHERE job_card_id = ?", [id]);
        await db.query("UPDATE appointments SET job_card_id = NULL WHERE job_card_id = ?", [id]);
        await db.query("DELETE FROM appointments WHERE job_card_id = ?", [id]);
        await db.query("DELETE FROM job_cards WHERE id = ?", [id]);
        console.log(`  ✓ Purged job card #${id}`);
      } catch (err) {
        console.error(`Error deleting job ${id}:`, err.message);
      }
    }

    const [apts] = await db.query("DELETE FROM appointments WHERE status = 'cancelled'");
    console.log(`Purged ${apts.affectedRows} cancelled appointments.`);
    console.log("Cleanup complete!");
  } catch (e) {
    console.error("Purge error:", e);
  } finally {
    process.exit(0);
  }
}

purgeCancelled();
