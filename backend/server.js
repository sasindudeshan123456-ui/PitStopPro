require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://pit-stop-pro.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth",          require("./routes/auth"));
app.use("/api/customers",     require("./routes/customers"));
app.use("/api/job-cards",     require("./routes/jobCards"));
app.use("/api/supervisor",    require("./routes/supervisor"));
app.use("/api/technician",    require("./routes/technician"));
app.use("/api/inventory",     require("./routes/inventory"));
app.use("/api/billing",       require("./routes/billing"));
app.use("/api/manager",       require("./routes/manager"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/appointments",  require("./routes/appointments"));

app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date() }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PitStopPro API running on http://localhost:${PORT}`));
