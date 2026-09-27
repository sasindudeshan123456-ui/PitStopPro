const db = require("../config/db");

const getAll = async () => {
  const [rows] = await db.query("SELECT * FROM garage_services ORDER BY category, name");
  return rows.map(r => ({
    ...r,
    required_items: typeof r.required_items === "string" ? (() => { try { return JSON.parse(r.required_items); } catch { return []; } })() : (r.required_items || [])
  }));
};

const findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM garage_services WHERE id = ?", [id]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    ...r,
    required_items: typeof r.required_items === "string" ? (() => { try { return JSON.parse(r.required_items); } catch { return []; } })() : (r.required_items || [])
  };
};

const create = async ({ service_code, name, category, description, base_price, estimated_hours, bay_type, required_items, image_url }) => {
  const itemsJson = Array.isArray(required_items) ? JSON.stringify(required_items) : (typeof required_items === "string" ? required_items : "[]");
  const [res] = await db.query(
    `INSERT INTO garage_services (service_code, name, category, description, base_price, estimated_hours, bay_type, required_items, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [service_code, name, category || "mechanical", description || "", base_price || 0, estimated_hours || 1, bay_type || "mechanical", itemsJson, image_url || null]
  );
  return res.insertId;
};

const update = async (id, { service_code, name, category, description, base_price, estimated_hours, bay_type, required_items, is_active, image_url }) => {
  const fields = [];
  const values = [];

  if (service_code !== undefined) { fields.push("service_code = ?"); values.push(service_code); }
  if (name !== undefined) { fields.push("name = ?"); values.push(name); }
  if (category !== undefined) { fields.push("category = ?"); values.push(category); }
  if (description !== undefined) { fields.push("description = ?"); values.push(description); }
  if (base_price !== undefined) { fields.push("base_price = ?"); values.push(base_price); }
  if (estimated_hours !== undefined) { fields.push("estimated_hours = ?"); values.push(estimated_hours); }
  if (bay_type !== undefined) { fields.push("bay_type = ?"); values.push(bay_type); }
  if (required_items !== undefined) {
    const itemsJson = Array.isArray(required_items) ? JSON.stringify(required_items) : (typeof required_items === "string" ? required_items : "[]");
    fields.push("required_items = ?");
    values.push(itemsJson);
  }
  if (image_url !== undefined) { fields.push("image_url = ?"); values.push(image_url); }
  if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active); }

  if (!fields.length) return;
  values.push(id);
  await db.query(`UPDATE garage_services SET ${fields.join(", ")} WHERE id = ?`, values);
};

const deleteService = async (id) => {
  await db.query("DELETE FROM garage_services WHERE id = ?", [id]);
};

module.exports = { getAll, findById, create, update, deleteService };
