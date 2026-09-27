const pool = require("../config/db");

async function migrate() {
  const sql = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('job_update','approval','system','material') NOT NULL DEFAULT 'system',
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      job_card_id INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL
    )
  `;
  try {
    await pool.query(sql);
    console.log("SUCCESS: notifications table created");
  } catch (e) {
    console.log("Already exists or error:", e.message);
  }
  process.exit(0);
}
migrate();
