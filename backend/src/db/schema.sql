-- ParkingWash — DDL Schema
-- Tabelas e índices para o sistema de estacionamento e lavação de veículos

-- ============================================================
-- Tabela: vehicle_types
-- Tipos de veículos com tarifas específicas
-- ============================================================
CREATE TABLE vehicle_types (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(50)    NOT NULL,
  code             VARCHAR(20)    UNIQUE NOT NULL,
  hourly_rate      NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0.01),
  daily_rate       NUMERIC(10, 2) NOT NULL CHECK (daily_rate >= 0.01),
  is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_types_is_active ON vehicle_types(is_active);
CREATE INDEX idx_vehicle_types_created_at ON vehicle_types(created_at DESC);

-- ============================================================
-- Tabela: parking_records
-- Registros de entrada e saída de veículos no estacionamento
-- ============================================================
CREATE TABLE parking_records (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate        VARCHAR(8)     NOT NULL,
  entry_time           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  exit_time            TIMESTAMPTZ,
  duration_minutes     INTEGER,
  total_amount         NUMERIC(10, 2),
  status               VARCHAR(10)    NOT NULL DEFAULT 'Parked'
                       CHECK (status IN ('Parked', 'Exited')),
  vehicle_type_id      UUID           REFERENCES vehicle_types(id),
  applied_daily_rate   BOOLEAN        DEFAULT FALSE,
  payment_status       VARCHAR(20)    DEFAULT 'Pending',
  payment_method_id    VARCHAR(100),
  payment_transaction_id VARCHAR(100)
);

CREATE INDEX idx_parking_records_status     ON parking_records(status);
CREATE INDEX idx_parking_records_entry_time ON parking_records(entry_time DESC);
CREATE INDEX idx_parking_records_vehicle_type_id ON parking_records(vehicle_type_id);
CREATE INDEX idx_parking_records_payment_status ON parking_records(payment_status);
CREATE INDEX idx_parking_records_exit_time_desc ON parking_records(exit_time DESC);

-- ============================================================
-- Tabela: wash_services
-- Catálogo de serviços de lavagem disponíveis
-- ============================================================
CREATE TABLE wash_services (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(100)   NOT NULL,
  price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0.01),
  duration_estimate INTEGER        NOT NULL CHECK (duration_estimate >= 0),
  is_active         BOOLEAN        NOT NULL DEFAULT TRUE
);

-- ============================================================
-- Tabela: wash_orders
-- Ordens de lavagem vinculadas a serviços
-- ============================================================
CREATE TABLE wash_orders (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate    VARCHAR(8)     NOT NULL,
  wash_service_id  UUID           NOT NULL REFERENCES wash_services(id),
  vehicle_type_id  UUID           REFERENCES vehicle_types(id),
  status           VARCHAR(20)    NOT NULL DEFAULT 'Waiting'
                   CHECK (status IN ('Waiting', 'InProgress', 'Completed')),
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ
);

CREATE INDEX idx_wash_orders_status     ON wash_orders(status);
CREATE INDEX idx_wash_orders_created_at ON wash_orders(created_at ASC);
CREATE INDEX idx_wash_orders_vehicle_type_id ON wash_orders(vehicle_type_id);
