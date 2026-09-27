const db = require("../config/db");

async function migrateServices() {
  try {
    console.log("Creating garage_services table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS garage_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'mechanical',
        description TEXT,
        base_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        estimated_hours DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        bay_type VARCHAR(50) NOT NULL DEFAULT 'mechanical',
        required_items TEXT,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Check if services already seeded
    const [existing] = await db.query("SELECT COUNT(*) AS count FROM garage_services");
    if (existing[0].count === 0) {
      console.log("Seeding default garage services...");
      const services = [
        [
          "SRV-PNT-001",
          "Full Body Painting & 2K Clear Coat",
          "painting",
          "Complete exterior panel preparation, sanding, primer application, 2K automotive base coat and clear coat spray finish in bake oven booth.",
          75000.00,
          16.0,
          "paint",
          JSON.stringify(["Automotive Paint 2K", "Automotive Primer", "Clear Coat Lacquer", "Sandpaper Grit 800/1200", "Masking Tape", "Paint Thinner"])
        ],
        [
          "SRV-PNT-002",
          "Single Panel Touch-Up & Scratch Paint",
          "painting",
          "Spot primer, localized base coat color blend, and clear coat spray polish for single doors, fenders or bumpers.",
          14500.00,
          4.0,
          "paint",
          JSON.stringify(["Automotive Paint (Selected Color)", "Surface Primer", "2K Clear Coat", "Rubbing Compound"])
        ],
        [
          "SRV-WLD-001",
          "Structural Chassis & Gas/Arc Welding",
          "welding",
          "Heavy chassis crack reinforcement, bracket welding, silencer pipe welding, and underbody structural repairs.",
          18500.00,
          6.0,
          "welding",
          JSON.stringify(["Welding Rod (5kg pack)", "MIG Wire Spool", "Argon / CO2 Gas", "Anti-Rust Underbody Primer"])
        ],
        [
          "SRV-WLD-002",
          "Silencer & Exhaust Pipe Welding",
          "welding",
          "Exhaust pipe leak patch welding, silencer box replacement, and hanger bracket repairs.",
          7500.00,
          2.0,
          "welding",
          JSON.stringify(["Welding Rod", "Exhaust Gasket", "High-Temp Anti-Corrosion Spray"])
        ],
        [
          "SRV-MNT-001",
          "Full Periodic Service & Lube Package",
          "periodic_maintenance",
          "Complete 10,000km / 20,000km scheduled service including engine oil flush, filter replacements, fluid top-ups and 40-point safety check.",
          8500.00,
          2.5,
          "mechanical",
          JSON.stringify(["Engine Oil 5W-30 (1L)", "Oil Filter - Universal", "Air Filter - Standard", "Coolant / Antifreeze (1L)", "Windshield Washer Fluid"])
        ],
        [
          "SRV-TYR-001",
          "Tyre Replacement, Balancing & Alignment",
          "wheel_tyre",
          "Removal of old tyres, mounting new tyres, computerized wheel balancing with lead weights, and 3D wheel alignment.",
          5500.00,
          1.5,
          "mechanical",
          JSON.stringify(["Tyre 195/65 R15 Bridgestone", "Tubeless Tyre Valve", "Wheel Balancing Lead Weights", "Tyre Bead Lube"])
        ],
        [
          "SRV-BRK-001",
          "Brake System Overhaul & Disc Skimming",
          "mechanical",
          "Front/Rear brake pad replacement, brake caliper pin lubrication, rotor disc skimming on lathe, and fluid bleed.",
          6500.00,
          2.5,
          "mechanical",
          JSON.stringify(["Front Brake Pads (set)", "Front Brake Disc", "Brake Fluid DOT4 (1L)", "Multi-purpose Grease (1kg)"])
        ],
        [
          "SRV-TNK-001",
          "Body Tinkering & Dent Pulling",
          "tinkering",
          "Hydraulic pull dent removal, panel straightening, body filler shaping, and alignment of bonnet/doors.",
          16000.00,
          5.0,
          "tinkering",
          JSON.stringify(["Body Filler (Putty)", "Hardener", "Spot Weld Studs", "Sanding Blocks"])
        ],
        [
          "SRV-ENG-001",
          "Engine Timing Belt & Water Pump Replacement",
          "mechanical",
          "Removal of timing cover, alignment of crankshaft/camshaft sprockets, replacement of timing belt, tensioner pulley, and water pump.",
          22000.00,
          7.0,
          "mechanical",
          JSON.stringify(["Timing Belt Kit", "Coolant / Antifreeze (1L)", "Engine Oil 5W-30 (1L)", "Silicone RTV Gasket Maker"])
        ],
        [
          "SRV-AC-001",
          "A/C Gas Charging & Leak Detection",
          "ac_repair",
          "Vacuum system evacuation, leak test with nitrogen/UV dye, compressor oil lubrication and R134a refrigerant charge.",
          11500.00,
          2.0,
          "mechanical",
          JSON.stringify(["R134a Refrigerant Gas (1kg)", "PAG Compressor Oil", "A/C O-Ring Seal Pack"])
        ]
      ];

      for (const s of services) {
        await db.query(
          `INSERT INTO garage_services (service_code, name, category, description, base_price, estimated_hours, bay_type, required_items)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          s
        );
      }
      console.log("Services seeded successfully.");
    }

    // Seed Tyres / Spare Wheels to inventory if not already present
    const [tyreCheck] = await db.query("SELECT id FROM inventory_items WHERE item_code = 'TYR-195-65-R15'");
    if (!tyreCheck.length) {
      console.log("Adding Tyre / Spare Wheel items to inventory...");
      const newItems = [
        ["TYR-195-65-R15", "Tyre 195/65 R15 Bridgestone Ecopia", "spare_part", "piece", 32500.00, 20.0, 4.0, "Bridgestone Lanka"],
        ["TYR-205-55-R16", "Tyre 205/55 R16 Dunlop Sport", "spare_part", "piece", 38000.00, 16.0, 4.0, "Dunlop Lanka"],
        ["SPW-15IN-ALLOY", "Spare Wheel 15-inch Alloy Rim (Universal)", "spare_part", "piece", 24000.00, 8.0, 2.0, "AlloyPro Lanka"],
        ["VALV-TYR-TR414", "Tubeless Tyre Valve Stem (Pack of 4)", "consumable", "pack", 650.00, 50.0, 10.0, "AutoParts Lanka"],
        ["WGT-BAL-100G", "Wheel Balancing Lead Weights (Box)", "consumable", "box", 2200.00, 15.0, 3.0, "AutoParts Lanka"]
      ];

      for (const item of newItems) {
        await db.query(
          `INSERT INTO inventory_items (item_code, name, category, unit, unit_price, quantity, low_stock_threshold, supplier)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          item
        );
      }
      console.log("Tyre items added to inventory.");
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}

migrateServices();
