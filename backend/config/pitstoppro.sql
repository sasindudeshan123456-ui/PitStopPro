-- =====================================================
-- PitStopPro Workshop Management System
-- Database Schema + Seed Data
-- MySQL | XAMPP | LKR Currency
-- =====================================================

CREATE DATABASE IF NOT EXISTS pitstoppro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pitstoppro;

CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM("manager","advisor","supervisor","technician","qc_inspector","storekeeper","cashier","customer") NOT NULL DEFAULT "customer",
    phone       VARCHAR(20),
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL UNIQUE,
    address     TEXT,
    nic         VARCHAR(20),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE vehicles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    make            VARCHAR(80) NOT NULL,
    model           VARCHAR(80) NOT NULL,
    year            YEAR NOT NULL,
    license_plate   VARCHAR(20) NOT NULL UNIQUE,
    color           VARCHAR(50),
    mileage         INT,
    vin             VARCHAR(50),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE job_cards (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    job_number          VARCHAR(20) NOT NULL UNIQUE,
    vehicle_id          INT NOT NULL,
    customer_id         INT NOT NULL,
    advisor_id          INT NOT NULL,
    reported_issue      TEXT NOT NULL,
    diagnosis_notes     TEXT,
    estimated_cost      DECIMAL(12,2) DEFAULT 0.00,
    status              ENUM("pending","in_progress","qc_check","completed","invoiced","cancelled") NOT NULL DEFAULT "pending",
    approval_required   TINYINT(1) NOT NULL DEFAULT 0,
    approval_status     ENUM("not_required","pending","approved","rejected") NOT NULL DEFAULT "not_required",
    approved_by         INT,
    approved_at         DATETIME,
    intake_date         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completion_date     DATETIME,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (advisor_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE vehicle_images (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    job_card_id INT NOT NULL,
    filename    VARCHAR(255) NOT NULL,
    label       VARCHAR(100),
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE
);

CREATE TABLE job_tasks (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    job_card_id     INT NOT NULL,
    task_name       VARCHAR(200) NOT NULL,
    bay_type        ENUM("mechanical","tinkering","paint","welding") NOT NULL,
    description     TEXT,
    status          ENUM("pending","assigned","in_progress","completed","rework") NOT NULL DEFAULT "pending",
    qc_passed       TINYINT(1),
    qc_notes        TEXT,
    qc_inspector_id INT,
    estimated_hours DECIMAL(5,2) DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (qc_inspector_id) REFERENCES users(id)
);

CREATE TABLE task_assignments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    task_id         INT NOT NULL,
    technician_id   INT NOT NULL,
    assigned_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by     INT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES job_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE labor_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    task_id         INT NOT NULL,
    technician_id   INT NOT NULL,
    clock_in        DATETIME NOT NULL,
    clock_out       DATETIME,
    notes           TEXT,
    FOREIGN KEY (task_id) REFERENCES job_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

CREATE TABLE inventory_items (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    item_code           VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(200) NOT NULL,
    category            ENUM("spare_part","paint","consumable","tool","other") NOT NULL DEFAULT "spare_part",
    unit                VARCHAR(20) DEFAULT "piece",
    unit_price          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quantity            DECIMAL(10,2) NOT NULL DEFAULT 0,
    low_stock_threshold DECIMAL(10,2) NOT NULL DEFAULT 5,
    description         TEXT,
    supplier            VARCHAR(150),
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE stock_transactions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    item_id         INT NOT NULL,
    type            ENUM("stock_in","stock_out","adjustment") NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL,
    reference       VARCHAR(100),
    notes           TEXT,
    performed_by    INT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE TABLE job_parts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    job_card_id     INT NOT NULL,
    item_id         INT NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL,
    unit_price      DECIMAL(12,2) NOT NULL,
    issued_by       INT NOT NULL,
    issued_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (issued_by) REFERENCES users(id)
);

CREATE TABLE requisitions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    job_card_id     INT NOT NULL,
    item_id         INT NOT NULL,
    quantity_needed DECIMAL(10,2) NOT NULL,
    requested_by    INT NOT NULL,
    status          ENUM("pending","approved","rejected","fulfilled") NOT NULL DEFAULT "pending",
    reviewed_by     INT,
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id),
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE invoices (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number          VARCHAR(20) NOT NULL UNIQUE,
    job_card_id             INT NOT NULL UNIQUE,
    customer_id             INT NOT NULL,
    subtotal                DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_pct            DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    discount_amount         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_pct                 DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total                   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_authorized_by  INT,
    status                  ENUM("draft","issued","paid","cancelled") NOT NULL DEFAULT "draft",
    created_by              INT NOT NULL,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (discount_authorized_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE invoice_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id      INT NOT NULL,
    description     VARCHAR(255) NOT NULL,
    type            ENUM("labor","part","other") NOT NULL DEFAULT "other",
    quantity        DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id      INT NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    method          ENUM("cash","card","bank_transfer") NOT NULL,
    reference       VARCHAR(100),
    received_by     INT NOT NULL,
    paid_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- SEED: Staff users (password = Admin@1234)
INSERT INTO users (full_name, email, password, role, phone) VALUES
("Workshop Manager",  "manager@pitstoppro.lk",    "$2b$10$8K1p/a0dclxFJQ1oPdDlPuU8gKaKr8e.Y7S9KDpJaHvJhFuqNH7Q6", "manager",     "0771234001"),
("Priya Kumari",      "advisor@pitstoppro.lk",    "$2b$10$8K1p/a0dclxFJQ1oPdDlPuU8gKaKr8e.Y7S9KDpJaHvJhFuqNH7Q6", "advisor",     "0771234002"),
("Nimal Perera",      "supervisor@pitstoppro.lk", "$2b$10$8K1p/a0dclxFJQ1oPdDlPuU8gKaKr8e.Y7S9KDpJaHvJhFuqNH7Q6", "supervisor",  "0771234003"),
("Kamal Silva",       "tech@pitstoppro.lk",       "$2b$10$8K1p/a0dclxFJQ1oPdDlPuU8gKaKr8e.Y7S9KDpJaHvJhFuqNH7Q6", "technician",  "0771234004"),
("Sumudu Fernando",   "qc@pitstoppro.lk",         "$2b$10$8K1p/a0dclxFJQ1oPdDlPuU8gKaKr8e.Y7S9KDpJaHvJhFuqNH7Q6", "qc_inspector","0771234005"),
("Ravi Jayawardena",  "store@pitstoppro.lk",      "$2b$10$8K1p/a0dclxFJQ1oPdDlPuU8gKaKr8e.Y7S9KDpJaHvJhFuqNH7Q6", "storekeeper", "0771234006"),
("Amali Wickrama",    "cashier@pitstoppro.lk",    "$2b$10$8K1p/a0dclxFJQ1oPdDlPuU8gKaKr8e.Y7S9KDpJaHvJhFuqNH7Q6", "cashier",     "0771234007");

-- SEED: Inventory
INSERT INTO inventory_items (item_code, name, category, unit, unit_price, quantity, low_stock_threshold, supplier) VALUES
("OIL-5W30-1L",  "Engine Oil 5W-30 (1L)",       "consumable", "bottle", 1850.00, 50, 10, "Lanka Lubricants"),
("FLT-OIL-001",  "Oil Filter - Universal",       "spare_part", "piece",   450.00, 30,  5, "AutoParts Lanka"),
("FLT-AIR-001",  "Air Filter - Standard",        "spare_part", "piece",   650.00, 20,  5, "AutoParts Lanka"),
("BRK-PAD-F001", "Front Brake Pads (set)",       "spare_part", "set",    2800.00, 15,  3, "Brake Masters"),
("BRK-DSC-F001", "Front Brake Disc",             "spare_part", "piece",  4500.00, 10,  2, "Brake Masters"),
("SPRK-NGK-B6S", "Spark Plug NGK B6S",           "spare_part", "piece",   380.00, 40,  8, "NGK Lanka"),
("BELT-TIMING",  "Timing Belt Kit",              "spare_part", "piece",  6500.00,  8,  2, "AutoParts Lanka"),
("COOLANT-1L",   "Coolant / Antifreeze (1L)",    "consumable", "bottle",  750.00, 25,  5, "Lanka Lubricants"),
("PAINT-WHT-1L", "Automotive Paint White (1L)",  "paint",      "can",    3200.00, 12,  3, "ColorMax"),
("PAINT-BLK-1L", "Automotive Paint Black (1L)",  "paint",      "can",    3200.00, 10,  3, "ColorMax"),
("PAINT-SLV-1L", "Automotive Paint Silver (1L)", "paint",      "can",    3500.00,  8,  3, "ColorMax"),
("WELD-ROD",     "Welding Rod (5kg pack)",       "consumable", "pack",   1200.00, 20,  5, "WeldPro"),
("GREASE-1KG",   "Multi-purpose Grease (1kg)",   "consumable", "kg",      550.00, 15,  3, "Lanka Lubricants"),
("CLNT-FLD-1L",  "Brake Fluid DOT4 (1L)",        "consumable", "bottle",  480.00, 20,  5, "AutoParts Lanka");
