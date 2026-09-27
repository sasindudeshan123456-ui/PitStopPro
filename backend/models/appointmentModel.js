const db = require("../config/db");

const create = async ({ customer_id, vehicle_id, services, preferred_date, preferred_time, customer_notes }) => {
  const [result] = await db.query(
    `INSERT INTO appointments (customer_id, vehicle_id, services, preferred_date, preferred_time, customer_notes, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [
      customer_id,
      vehicle_id,
      typeof services === "string" ? services : JSON.stringify(services),
      preferred_date,
      preferred_time || "Morning (08:30 AM - 12:00 PM)",
      customer_notes || null
    ]
  );
  return result.insertId;
};

const enrichServicesWithPrices = async (rows) => {
  if (!rows || rows.length === 0) return rows;
  try {
    const [servicesDb] = await db.query("SELECT id, service_code, name, base_price, bay_type FROM garage_services");
    const srvByName = new Map();
    const srvById = new Map();
    const srvByCode = new Map();
    servicesDb.forEach(s => {
      if (s.name) srvByName.set(s.name.trim().toLowerCase(), s);
      if (s.id) srvById.set(String(s.id), s);
      if (s.service_code) srvByCode.set(s.service_code.trim().toLowerCase(), s);
    });

    return rows.map(r => {
      let sList = [];
      try {
        sList = typeof r.services === "string" ? JSON.parse(r.services) : (r.services || []);
        if (!Array.isArray(sList)) sList = [sList];
      } catch {
        sList = [{ name: r.services }];
      }

      const enriched = sList.map(item => {
        if (typeof item === "string") {
          const found = srvByName.get(item.trim().toLowerCase());
          return {
            name: item,
            price: found ? parseFloat(found.base_price) : 0,
            base_price: found ? parseFloat(found.base_price) : 0,
            bay_type: found ? found.bay_type : null,
            id: found ? found.id : null
          };
        } else if (typeof item === "object" && item !== null) {
          let price = item.price !== undefined && item.price !== null ? parseFloat(item.price) : (item.base_price !== undefined && item.base_price !== null ? parseFloat(item.base_price) : null);
          let name = item.name || "Service";
          let found = null;
          if (name && srvByName.has(name.trim().toLowerCase())) {
            found = srvByName.get(name.trim().toLowerCase());
          } else if (item.id && srvById.has(String(item.id))) {
            found = srvById.get(String(item.id));
          } else if (item.service_code && srvByCode.has(item.service_code.trim().toLowerCase())) {
            found = srvByCode.get(item.service_code.trim().toLowerCase());
          }

          if (found) {
            if (price === null || isNaN(price) || price === 0) {
              price = parseFloat(found.base_price);
            }
            if (!name || name === "Service") name = found.name;
          }

          return {
            ...item,
            name,
            price: price !== null && !isNaN(price) ? price : 0,
            base_price: price !== null && !isNaN(price) ? price : 0,
            bay_type: item.bay_type || (found ? found.bay_type : null),
            id: item.id || (found ? found.id : null)
          };
        }
        return item;
      });

      return {
        ...r,
        services: enriched
      };
    });
  } catch (err) {
    console.error("Error enriching services with prices:", err);
    return rows;
  }
};

const getAll = async () => {
  const [rows] = await db.query(`
    SELECT a.*,
           u.full_name AS customer_name,
           u.phone AS customer_phone,
           u.email AS customer_email,
           v.make,
           v.model,
           v.license_plate,
           v.year AS vehicle_year,
           jc.job_number,
           jc.status AS job_status,
           jc.approval_status AS job_approval_status
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    JOIN vehicles v ON a.vehicle_id = v.id
    LEFT JOIN job_cards jc ON a.job_card_id = jc.id
    ORDER BY a.created_at DESC, a.id DESC
  `);
  return await enrichServicesWithPrices(rows);
};

const getByCustomer = async (customer_id) => {
  const [rows] = await db.query(`
    SELECT a.*,
           v.make,
           v.model,
           v.license_plate,
           v.year AS vehicle_year,
           jc.job_number,
           jc.status AS job_status,
           jc.approval_status AS job_approval_status
    FROM appointments a
    JOIN vehicles v ON a.vehicle_id = v.id
    LEFT JOIN job_cards jc ON a.job_card_id = jc.id
    WHERE a.customer_id = ?
    ORDER BY a.created_at DESC, a.id DESC
  `, [customer_id]);
  return await enrichServicesWithPrices(rows);
};

const findById = async (id) => {
  const [rows] = await db.query(`
    SELECT a.*,
           u.full_name AS customer_name,
           u.phone AS customer_phone,
           u.email AS customer_email,
           v.make,
           v.model,
           v.license_plate,
           v.year AS vehicle_year,
           jc.job_number
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    JOIN vehicles v ON a.vehicle_id = v.id
    LEFT JOIN job_cards jc ON a.job_card_id = jc.id
    WHERE a.id = ?
  `, [id]);
  if (!rows[0]) return null;
  const enriched = await enrichServicesWithPrices([rows[0]]);
  return enriched[0] || null;
};

const update = async (id, { vehicle_id, services, preferred_date, preferred_time, customer_notes }) => {
  await db.query(
    `UPDATE appointments 
     SET vehicle_id = ?, 
         services = ?, 
         preferred_date = ?, 
         preferred_time = ?, 
         customer_notes = ?
     WHERE id = ?`,
    [
      vehicle_id,
      typeof services === "string" ? services : JSON.stringify(services),
      preferred_date,
      preferred_time,
      customer_notes || null,
      id
    ]
  );
};

const updateStatus = async (id, status, job_card_id = null) => {
  if (job_card_id) {
    await db.query(
      "UPDATE appointments SET status = ?, job_card_id = ? WHERE id = ?",
      [status, job_card_id, id]
    );
  } else {
    await db.query(
      "UPDATE appointments SET status = ? WHERE id = ?",
      [status, id]
    );
  }
};

const deleteAppointment = async (id) => {
  try {
    await db.query("UPDATE job_cards SET appointment_id = NULL WHERE appointment_id = ?", [id]);
  } catch (e) {}
  await db.query("DELETE FROM appointments WHERE id = ?", [id]);
};

module.exports = {
  create,
  getAll,
  getByCustomer,
  findById,
  update,
  updateStatus,
  deleteAppointment
};
