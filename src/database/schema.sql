-- ============================================
-- MASTER SCHEMA - CLEANING SERVICE PLATFORM
-- Version: 2.1 (Optimized for Booking & Assignment)
-- ============================================

-- 1. CLEANUP
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS cleaners CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. TABLE: USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CUSTOMER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- 3. TABLE: SERVICES
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT TRUE,
    layout_config JSONB DEFAULT '[]'::jsonb, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
CREATE INDEX idx_services_active ON services(is_active) WHERE deleted_at IS NULL;

-- 4. TABLE: CLEANERS
CREATE TABLE cleaners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE, -- Mới thêm: Để liên hệ/login sau này
    avatar TEXT,               -- Mới thêm: Ảnh đại diện
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 5. TABLE: BOOKINGS
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    cleaner_id INTEGER DEFAULT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    location TEXT NOT NULL, -- "Single source of truth" hiển thị nhanh
    note TEXT,
    cancel_reason TEXT,     -- Mới thêm: Lưu lý do hủy riêng
    
    total_price DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    
    booking_data JSONB DEFAULT '{}'::jsonb,
    
    -- Review (Chuẩn bị cho tương lai)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id) ON DELETE RESTRICT,
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_cleaner ON bookings(cleaner_id); -- Index để check trùng lịch nhanh hơn
CREATE INDEX idx_bookings_booking_data ON bookings USING GIN (booking_data);

-- ============================================
-- SEED DATA
-- ============================================

-- Admin User
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@cleaningservice.com', '$2a$10$4UQENyXr/jSD/iAehtV3l.AIv/AIuEUGHnrABv1Hm8cbyYDRPJ/2a', 'System Admin', '0901234567', 'ADMIN');

-- Cleaners (Mới thêm để test Gán việc)
INSERT INTO cleaners (name, phone, email, status) VALUES 
('Nguyễn Văn A', '0900000001', 'cleaner1@test.com', 'ACTIVE'),
('Trần Thị B', '0900000002', 'cleaner2@test.com', 'ACTIVE');

-- Services: Dọn nhà (ID 1)
INSERT INTO services (name, description, base_price, duration_minutes, is_active, layout_config) VALUES
('Home Cleaning', 'Home cleaning service', 150000, 120, true, 
'[
  {"type": "intro", "order": 0, "data": {"title": "Home Cleaning Service", "banner_image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079306/cleaning-service/uzynzcrujxjby2f2qm8b.jpg"}},
  {"type": "pricing", "order": 1, "data": {"service_title": "Cleaning Packages", "note": "Prices include VAT. Please note that the final cost may vary depending on the actual condition of your home, specific cleaning requests, the number of rooms, and any additional tasks required during the service.", "subservices": [{"id": "2br", "subservice_title": "2-Bedroom Apartment", "price": 400000}, {"id": "3br", "subservice_title": "3-Bedroom Apartment", "price": 550000}]}},
  {
  "type": "task_tab",
  "order": 2,
  "data": {
    "title": "Detailed Work Items",
    "tabs": [
      {
        "tab_title": "Living Room",
        "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079308/cleaning-service/rtbyxdk1z60abeg50dlj.jpg",
        "description": "<ul><li>Sweep and mop floors; vacuum carpets.</li><li>Dust all surfaces: tables, chairs, TV stands, display cabinets.</li><li>Organize items neatly in their proper places.</li><li>Clean glass doors and entrance doors (within reachable height).</li><li>Empty trash bins and replace with new liners.</li></ul>"
      },
      {
        "tab_title": "Kitchen",
        "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079306/cleaning-service/drimeim9uosrjnaicte5.jpg",
        "description": "<ul><li>Wash dishes, pots, and pans; arrange them properly.</li><li>Clean stovetop surfaces and backsplash tiles.</li><li>Sanitize sink and faucet.</li><li>Wipe exterior surfaces of refrigerator, microwave, and kitchen cabinets.</li><li>Clean kitchen floors and dispose of household waste.</li></ul>"
      },
      {
        "tab_title": "Bedroom",
        "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079305/cleaning-service/tmisxw1xa6ecjmhkqnjr.jpg",
        "description": "<ul><li>Fold blankets and arrange pillows neatly on the bed.</li><li>Change bed sheets (upon request and if available).</li><li>Dust dressing tables, nightstands, and picture frames.</li><li>HVacuum or mop the floor thoroughly.</li><li>Collect dirty laundry into baskets (if available).</li></ul>"
      },
      {
        "tab_title": "Bathroom",
        "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079305/cleaning-service/mi4bql402c6massotyjt.jpg",
        "description": "<ul><li>Scrub and deodorize the toilet.</li><li>Clean the sink, faucet, bathtub/shower glass panels.</li><li>Polish mirrors and shelves.</li><li>Scrub bathroom floors and tile walls.</li><li>Organize towels and restock toilet paper (if available).</li></ul>"
      }
    ]
  }
},
  {"type": "booking", "order": 3, "data": {"title": "Get a Quote", "button_text": "Submit Request", "image_url":"https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079886/cleaning-service/wfupg0vbm9fqdu0kr6mi.jpg","form_schema": [{"field_name": "name", "field_type": "text", "label": "Name", "required": true}, {"field_name": "address", "field_type": "text", "label": "Address", "required": true}, {"field_name": "phone", "field_type": "text", "label": "Phone number", "required": true}, {"field_name": "subservice_id", "field_type": "select", "label": "Select Package", "required": true, "options": ["2 bedroom", "3bedroom"]}, {"field_name": "booking_date", "field_type": "date", "label": "Cleaning Date", "required": true}, {"field_name": "booking_time", "field_type": "time", "label": "Cleaning Time", "required": true}]}}
]'::jsonb);

-- Services: Chuyển nhà (ID 2)
-- 🔥 Đã đồng bộ ID "truck_0t5" để khớp với code test Postman của bạn
INSERT INTO services (name, description, base_price, duration_minutes, is_active, layout_config) VALUES
('Full-package House Moving', 'Fast & Affordable Full-service House Moving', 500000, 300, true,
'[
  {"type": "intro", "order": 0, "data": {"title": "House Moving Service", "banner_image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078514/cleaning-service/udypphvg2lixgrmcwjyx.jpg"}},
  {"type": "pricing", "order": 1, "data": {"service_title": "Vehicle Pricing", "note": "Vehicle prices shown are for transportation only and exclude loading/unloading labor. Costs may vary depending on the quantity and weight of your items, floor access, elevator availability, and the need for special care when handling fragile or oversized belongings.", "subservices": [{"id": "truck_0t5", "subservice_title": "500kg Truck", "price": 350000}, {"id": "truck_1t5", "subservice_title": "1.5 Ton Truck", "price": 800000}, {"id": "truck_2t", "subservice_title": "2 Ton Truck", "price": 1200000}]}},
  {
  "type": "process",
  "order": 2,
  "data": {
    "title": "Standard House Moving Process",
    "steps": [
      {
        "number": 1,
        "step_title": "Packing & Sorting",
        "description": "Our team arrives on time to sort your belongings and carefully pack them into specialized cardboard boxes. Fragile items are wrapped and cushioned thoroughly to ensure maximum protection.",
        "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078513/cleaning-service/x0jpi1tx3deweqtogzbr.jpg"
      },
      {
        "number": 2,
        "step_title": "Safe Transportation",
        "description": "We use specialized closed-box trucks operated by experienced drivers. Your belongings are arranged systematically inside the truck to prevent shifting or damage during the move to the new location.",
        "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078513/cleaning-service/taeptiurt1v5qy3usssl.jpg"
      },
      {
        "number": 3,
        "step_title": "Inspection & Handover",
        "description": "At the new home, our staff assists in carrying items into the designated rooms as requested. Customers and staff jointly check all belongings based on the inventory list before signing the handover report and completing payment.",
        "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078512/cleaning-service/zbzjbqejppwmuzhoeyaq.jpg"
      }
    ]
  }
},
  {"type": "booking", "order": 3, "data": {"title": "Get a Quote","image_url":"https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079886/cleaning-service/wfupg0vbm9fqdu0kr6mi.jpg", "button_text": "Submit Request", "form_schema": [{"field_name": "name", "field_type": "text", "label": "Name", "required": true}, {"field_name": "from_address", "field_type": "text", "label": "Pickup Address", "required": true}, {"field_name": "to_address", "field_type": "text", "label": "Drop-off Address", "required": true}, {"field_name": "booking_date", "field_type": "date", "label": "Moving Date", "required": true}, {"field_name": "booking_time", "field_type": "time", "label": "Moving Time", "required": true}, {"field_name": "phone", "field_type": "text", "label": "Phone Number", "required": true}, {"field_name": "subservice_id", "field_type": "select", "label": "Vehicle Type", "required": true, "options": ["truck_0t5", "truck_1t5", "truck_2t"]}]}}
]'::jsonb);