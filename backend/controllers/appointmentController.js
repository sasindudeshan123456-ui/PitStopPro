const appointmentModel = require("../models/appointmentModel");
const customerModel = require("../models/customerModel");
const vehicleModel = require("../models/vehicleModel");
const notificationsModel = require("../models/notificationsModel");
const db = require("../config/db");

const create = async (req, res) => {
  try {
    const user_id = req.user.id;
    let customer = await customerModel.findByUserId(user_id);
    if (!customer) {
      const custId = await customerModel.create({ user_id });
      customer = await customerModel.findById(custId);
    }

    const { vehicle_id, new_vehicle, services = [], preferred_date, preferred_time, customer_notes, pay_now, payment_method, payment_details } = req.body;

    if (!services || services.length === 0) {
      return res.status(400).json({ message: "Please select at least one service." });
    }
    if (!preferred_date) {
      return res.status(400).json({ message: "Please select a preferred appointment date." });
    }

    let targetVehicleId = vehicle_id;
    if (!targetVehicleId && new_vehicle && new_vehicle.license_plate) {
      const existing = await vehicleModel.findByPlate(new_vehicle.license_plate);
      if (existing) {
        targetVehicleId = existing.id;
      } else {
        targetVehicleId = await vehicleModel.create({
          customer_id: customer.id,
          license_plate: new_vehicle.license_plate,
          make: new_vehicle.make || "Vehicle",
          model: new_vehicle.model || "Standard",
          year: new_vehicle.year || new Date().getFullYear(),
          color: new_vehicle.color || "Standard"
        });
      }
    }

    if (!targetVehicleId) {
      const vehicles = await vehicleModel.findByCustomer(customer.id);
      if (vehicles.length) {
        targetVehicleId = vehicles[0].id;
      } else {
        return res.status(400).json({ message: "Please register or select a vehicle for this booking." });
      }
    }

    // Calculate total price of services
    let totalAmount = 0;
    const [servicesDb] = await db.query("SELECT id, name, base_price FROM garage_services");
    const srvMap = new Map();
    servicesDb.forEach(s => srvMap.set(String(s.id), s));

    const enrichedServices = services.map(s => {
      let price = parseFloat(s.base_price || s.price || 0);
      if ((!price || isNaN(price)) && s.id && srvMap.has(String(s.id))) {
        price = parseFloat(srvMap.get(String(s.id)).base_price);
      }
      totalAmount += price;
      return { ...s, price, base_price: price };
    });

    const appointmentId = await appointmentModel.create({
      customer_id: customer.id,
      vehicle_id: targetVehicleId,
      services: enrichedServices,
      preferred_date,
      preferred_time,
      customer_notes: pay_now ? (customer_notes ? `${customer_notes} [Paid Online: LKR ${totalAmount.toLocaleString()}]` : `[Paid Online: LKR ${totalAmount.toLocaleString()}]`) : customer_notes
    });

    // If paid now, mark appointment as confirmed and generate invoice & payment record
    if (pay_now && totalAmount > 0) {
      await db.query("UPDATE appointments SET status = 'confirmed' WHERE id = ?", [appointmentId]);

      try {
        const d = new Date();
        const invoice_number = `INV-APT-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${Date.now().toString().slice(-4)}${appointmentId}`;
        const [invR] = await db.query(
          `INSERT INTO invoices (invoice_number, customer_id, subtotal, discount_pct, discount_amount, tax_pct, tax_amount, total, status, type, created_by)
           VALUES (?, ?, ?, 0, 0, 0, 0, ?, 'paid', 'direct_sale', ?)`,
          [invoice_number, customer.id, totalAmount, totalAmount, user_id]
        );
        const invId = invR.insertId;

        for (const s of enrichedServices) {
          await db.query(
            "INSERT INTO invoice_items (invoice_id, description, type, quantity, unit_price) VALUES (?, ?, 'labor', 1, ?)",
            [invId, s.name || "Workshop Service", s.price || s.base_price || 0]
          );
        }

        await db.query(
          "INSERT INTO payments (invoice_id, amount, method, reference, received_by) VALUES (?, ?, ?, ?, ?)",
          [invId, totalAmount, payment_method || "card", `Online Advance Payment for Appointment #${appointmentId}`, user_id]
        );
      } catch (invErr) {
        console.error("Error creating appointment invoice:", invErr);
      }
    }

    // Notify customer
    try {
      const sNames = services.map(s => s.name || s).join(", ");
      await notificationsModel.create({
        user_id,
        title: pay_now ? "💳 Appointment Booked & Paid" : "📅 Appointment Booked",
        message: pay_now
          ? `Your payment of LKR ${totalAmount.toLocaleString()} has been received! Appointment for ${preferred_date} (${sNames}) is confirmed. Official receipt is available in Receipts.`
          : `Your service appointment for ${preferred_date} (${sNames}) has been requested and is awaiting confirmation.`,
        type: "system"
      });

      // Notify workshop manager
      const [managers] = await db.query("SELECT id FROM users WHERE role = 'manager' OR role = 'advisor'");
      for (const m of managers) {
        await notificationsModel.create({
          user_id: m.id,
          title: pay_now ? "💰 New Paid Appointment Booking" : "🔔 New Service Appointment",
          message: pay_now
            ? `New PAID appointment (LKR ${totalAmount.toLocaleString()}) booked for ${preferred_date} by customer (${customer.full_name || "Customer"}).`
            : `New appointment requested for ${preferred_date} by customer (${customer.full_name || "Customer"}).`,
          type: "system"
        });
      }
    } catch (e) {
      console.error("Appointment notification error:", e);
    }

    res.status(201).json({
      message: pay_now
        ? "Payment processed & Appointment booked successfully! Official receipt generated."
        : "Appointment booked successfully! We look forward to seeing you.",
      appointment_id: appointmentId,
      paid: !!pay_now
    });
  } catch (err) {
    console.error("Create appointment error:", err);
    res.status(500).json({ message: err.message });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const customer = await customerModel.findByUserId(req.user.id);
    if (!customer) return res.json([]);
    const appointments = await appointmentModel.getByCustomer(customer.id);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel.getAll();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, job_card_id } = req.body;

    // If customer, verify ownership and allowed status transition
    if (req.user.role === "customer") {
      const customer = await customerModel.findByUserId(req.user.id);
      const apt = await appointmentModel.findById(id);
      if (!apt || !customer || apt.customer_id !== customer.id) {
        return res.status(403).json({ message: "Unauthorized to update this appointment." });
      }
      if (status !== "confirmed" && status !== "cancelled") {
        return res.status(400).json({ message: "Customers can only confirm or cancel their appointments." });
      }
    }

    await appointmentModel.updateStatus(id, status, job_card_id);

    // Notify customer on status update or notify garage staff on customer confirmation
    try {
      const apt = await appointmentModel.findById(id);
      if (apt) {
        if (req.user.role !== "customer") {
          const [c] = await db.query("SELECT user_id FROM customers WHERE id = ?", [apt.customer_id]);
          if (c.length) {
            let title = `📅 Appointment: ${status.toUpperCase()}`;
            let message = `Your appointment on ${new Date(apt.preferred_date).toLocaleDateString()} status is now: ${status}.`;
            if (status === "approved") {
              title = "🎉 Appointment Approved by Garage!";
              message = `Your requested appointment for ${new Date(apt.preferred_date).toLocaleDateString()} (${apt.preferred_time}) was approved by our workshop. Please confirm your booking slot.`;
            }
            await notificationsModel.create({
              user_id: c[0].user_id,
              title,
              message,
              type: "system"
            });
          }
        } else if (status === "confirmed") {
          // Notify workshop staff
          const [managers] = await db.query("SELECT id FROM users WHERE role = 'manager' OR role = 'advisor'");
          for (const m of managers) {
            await notificationsModel.create({
              user_id: m.id,
              title: "✅ Customer Confirmed Appointment Slot",
              message: `Customer confirmed their appointment for ${new Date(apt.preferred_date).toLocaleDateString()} (${apt.preferred_time}). Vehicle intake pending on arrival.`,
              type: "system"
            });
          }
        }
      }
    } catch (e) { /* ignore */ }

    res.json({ message: `Appointment status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    let customer = await customerModel.findByUserId(user_id);

    const apt = await appointmentModel.findById(id);
    if (!apt) return res.status(404).json({ message: "Appointment not found." });

    if (customer && apt.customer_id !== customer.id && req.user.role !== "manager" && req.user.role !== "advisor") {
      return res.status(403).json({ message: "Unauthorized to modify this appointment." });
    }

    if (apt.status !== "pending") {
      return res.status(400).json({ message: "Only pending appointments can be edited before confirmation or approval." });
    }

    const { vehicle_id, services, preferred_date, preferred_time, customer_notes } = req.body;
    if (!services || services.length === 0) {
      return res.status(400).json({ message: "Please select at least one service." });
    }
    if (!preferred_date) {
      return res.status(400).json({ message: "Please select a preferred date." });
    }

    await appointmentModel.update(id, {
      vehicle_id: vehicle_id || apt.vehicle_id,
      services,
      preferred_date,
      preferred_time: preferred_time || apt.preferred_time,
      customer_notes: customer_notes !== undefined ? customer_notes : apt.customer_notes
    });

    res.json({ message: "Appointment updated successfully!" });
  } catch (err) {
    console.error("Update appointment error:", err);
    res.status(500).json({ message: err.message });
  }
};

const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    let customer = await customerModel.findByUserId(user_id);

    const apt = await appointmentModel.findById(id);
    if (!apt) return res.status(404).json({ message: "Appointment not found." });

    if (customer && apt.customer_id !== customer.id && req.user.role !== "manager" && req.user.role !== "advisor") {
      return res.status(403).json({ message: "Unauthorized to delete this appointment." });
    }

    if (apt.status === "checked_in") {
      return res.status(400).json({ message: "Cannot delete an appointment that is already checked-in with an active job card." });
    }

    // Permanently remove from database
    await appointmentModel.deleteAppointment(id);

    // Send notifications
    try {
      if (req.user.role === "customer") {
        const [managers] = await db.query("SELECT id FROM users WHERE role = 'manager' OR role = 'advisor'");
        for (const m of managers) {
          await notificationsModel.create({
            user_id: m.id,
            title: "🚫 Appointment Removed by Customer",
            message: `Customer cancelled and deleted appointment for ${new Date(apt.preferred_date).toLocaleDateString()} (${apt.license_plate}).`,
            type: "system"
          });
        }
      } else {
        const [c] = await db.query("SELECT user_id FROM customers WHERE id = ?", [apt.customer_id]);
        if (c.length) {
          await notificationsModel.create({
            user_id: c[0].user_id,
            title: "🚫 Appointment Removed",
            message: `Your appointment for ${new Date(apt.preferred_date).toLocaleDateString()} has been cancelled and removed by workshop staff.`,
            type: "system"
          });
        }
      }
    } catch (e) { /* ignore */ }

    res.json({ message: "Appointment cancelled and deleted successfully." });
  } catch (err) {
    console.error("Cancel appointment error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  create,
  getMyAppointments,
  getAllAppointments,
  update,
  cancel,
  deleteAppointment: cancel,
  updateStatus
};
