CREATE TABLE IF NOT EXISTS dealers (
 id BIGSERIAL PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 email VARCHAR(320) NOT NULL UNIQUE,
 phone VARCHAR(32), address TEXT NOT NULL, website_url TEXT,
 latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL,
 plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK(plan IN ('free','premium')),
 premium_until TIMESTAMPTZ, stripe_customer_id TEXT, stripe_subscription_id TEXT,
 api_key_hash CHAR(64) NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS vehicles (
 id BIGSERIAL PRIMARY KEY, dealer_id BIGINT NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
 title VARCHAR(255) NOT NULL, price INTEGER NOT NULL CHECK(price>0), year INTEGER,
 make VARCHAR(64), model VARCHAR(64), mileage VARCHAR(64), image_url TEXT,
 auction_deadline TIMESTAMPTZ NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vehicles_active_deadline_idx ON vehicles(active,auction_deadline);
CREATE INDEX IF NOT EXISTS dealers_geo_idx ON dealers(latitude,longitude);
