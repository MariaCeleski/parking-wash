-- ParkingWash — Seed Data
-- Tipos de veículos com tarifas padrão

INSERT INTO vehicle_types (name, code, hourly_rate, daily_rate, is_active) VALUES
  ('Motocicleta', 'MOTORCYCLE', 5.00, 30.00, TRUE),
  ('Carro', 'CAR', 10.00, 60.00, TRUE),
  ('Motorhome', 'MOTORHOME', 20.00, 120.00, TRUE);

-- Serviços de lavagem iniciais

INSERT INTO wash_services (name, price, duration_estimate, is_active) VALUES
  ('Lavagem Simples',   30.00,  30, TRUE),
  ('Lavagem Completa',  60.00,  60, TRUE),
  ('Polimento',        120.00, 120, TRUE);
