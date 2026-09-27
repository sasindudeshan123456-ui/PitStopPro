const db = require("../config/db");

async function syncInvoices() {
  try {
    const [jcs] = await db.query(`
      SELECT jc.*, c.id AS cust_id 
      FROM job_cards jc 
      JOIN customers c ON c.id = jc.customer_id 
      WHERE jc.status = 'invoiced'
    `);

    console.log(`Found ${jcs.length} invoiced job cards.`);

    for (const jc of jcs) {
      const [existing] = await db.query("SELECT id FROM invoices WHERE job_card_id = ?", [jc.id]);
      if (!existing.length) {
        const d = new Date();
        const invoice_number = `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${Date.now().toString().slice(-4)}${jc.id}`;
        const subtotal = parseFloat(jc.estimated_cost || 0);

        const [r] = await db.query(
          `INSERT INTO invoices (invoice_number, job_card_id, customer_id, subtotal, discount_pct, discount_amount, tax_pct, tax_amount, total, status, created_by) 
           VALUES (?, ?, ?, ?, 0, 0, 0, 0, ?, 'paid', ?)`,
          [invoice_number, jc.id, jc.cust_id, subtotal, subtotal, jc.advisor_id || 1]
        );
        const invId = r.insertId;

        await db.query(
          "INSERT INTO invoice_items (invoice_id, description, type, quantity, unit_price) VALUES (?, ?, 'labor', 1, ?)",
          [invId, jc.reported_issue || "Garage Workshop Service & Repairs", subtotal]
        );

        await db.query(
          "INSERT INTO payments (invoice_id, amount, method, reference, received_by) VALUES (?, ?, 'cash', 'Settled at Vehicle Handover', ?)",
          [invId, subtotal, jc.advisor_id || 1]
        );

        console.log(`Created invoice #${invoice_number} for Job Card ${jc.job_number}`);
      }
    }
    console.log("Invoice sync completed successfully!");
  } catch (err) {
    console.error("Error syncing invoices:", err);
  } finally {
    process.exit(0);
  }
}

syncInvoices();
