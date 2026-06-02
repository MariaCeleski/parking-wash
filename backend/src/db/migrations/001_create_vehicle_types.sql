-- Migration: 001_create_vehicle_types
-- Description: Create vehicle_types table with pricing configuration
-- Date: 2024
-- Status: Up

-- ============================================================
-- Tabela: vehicle_types
-- Tipos de veículos com tarifas específicas (horária e diária)
-- ============================================================
CREATE TABLE vehicle_types (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(50)    NOT NULL,
  code             VARCHAR(20)    UNIQUE NOT NULL,
  hourly_rate      NUMERIC(10,2)  NOT NULL CHECK (hourly_rate >= 0.01),
  daily_rate       NUMERIC(10,2)  NOT NULL CHECK (daily_rate >= 0.01),
  is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Índices para otimização de consultas
CREATE INDEX idx_vehicle_types_is_active ON vehicle_types(is_active);
CREATE INDEX idx_vehicle_types_code ON vehicle_types(code);

-- Seed de dados iniciais com tipos de veículo padrão
INSERT INTO vehicle_types (name, code, hourly_rate, daily_rate, is_active)
VALUES
  ('Motorcycle', 'MOTO', 5.00, 30.00, TRUE),
  ('Car', 'CAR', 10.00, 60.00, TRUE),
  ('Motorhome', 'MOTORHOME', 20.00, 120.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Rollback Script (execute to undo this migration)
-- ============================================================
-- DROP TABLE IF EXISTS vehicle_types CASCADE;
