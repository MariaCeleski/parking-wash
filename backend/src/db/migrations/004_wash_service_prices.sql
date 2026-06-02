-- Migration: 004_wash_service_prices
-- Description: Create wash_service_prices table for fixed pricing by vehicle type + wash service combination,
--              and add price column to wash_orders for immutable price capture at order creation.
-- Date: 2025
-- Status: Up

-- ============================================================
-- Tabela: wash_service_prices
-- Preços fixos por combinação de tipo de veículo × serviço de lavagem
-- ============================================================
CREATE TABLE wash_service_prices (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type_id  UUID           NOT NULL REFERENCES vehicle_types(id) ON DELETE CASCADE,
  wash_service_id  UUID           NOT NULL REFERENCES wash_services(id) ON DELETE CASCADE,
  price            NUMERIC(10, 2) NOT NULL CHECK (price >= 0.01 AND price <= 99999999.99),
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_vehicle_service_price UNIQUE (vehicle_type_id, wash_service_id)
);

-- Índices para otimização de consultas por FK
CREATE INDEX idx_wsp_vehicle_type ON wash_service_prices(vehicle_type_id);
CREATE INDEX idx_wsp_wash_service ON wash_service_prices(wash_service_id);

-- ============================================================
-- Alter Table: wash_orders
-- Adicionar coluna price para armazenar preço fixo no momento da criação
-- ============================================================

-- Passo 1: Adicionar coluna nullable
ALTER TABLE wash_orders
  ADD COLUMN price NUMERIC(10, 2);

-- Passo 2: Preencher ordens existentes com o preço do serviço (fallback)
UPDATE wash_orders wo
  SET price = ws.price
  FROM wash_services ws
  WHERE wo.wash_service_id = ws.id
    AND wo.price IS NULL;

-- Passo 3: Tornar coluna NOT NULL após migração de dados
ALTER TABLE wash_orders
  ALTER COLUMN price SET NOT NULL;

-- Passo 4: Adicionar CHECK constraint para validação de range
ALTER TABLE wash_orders
  ADD CONSTRAINT chk_wash_order_price CHECK (price >= 0.01 AND price <= 99999999.99);

-- ============================================================
-- Rollback Script (execute to undo this migration)
-- ============================================================
-- ALTER TABLE wash_orders DROP CONSTRAINT IF EXISTS chk_wash_order_price;
-- ALTER TABLE wash_orders DROP COLUMN IF EXISTS price;
-- DROP TABLE IF EXISTS wash_service_prices CASCADE;
