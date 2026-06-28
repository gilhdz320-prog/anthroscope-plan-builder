-- Run in Supabase SQL Editor for planbuilder.anthroscope.pro
-- Project: vdajfetrigxgzcfjfcls
-- Inserts 11 missing seed templates (4 already exist)

INSERT INTO public.templates (name, description, goal, kcal_target, is_public, is_seed) VALUES
('Resistencia Aeróbica Elite', 'P180/C520/G70 — High-carb endurance protocol for marathon/triathlon athletes', 'endurance', 3200, true, true),
('Definición Competitiva', 'P220/C180/G55 — Pre-competition cut with muscle retention priority', 'cut', 1900, true, true),
('Hipertrofia Máxima', 'P240/C380/G90 — Aggressive mass gain for off-season strength athletes', 'bulk', 3800, true, true),
('Fuerza Funcional', 'P190/C300/G80 — CrossFit & functional fitness periodization', 'performance', 2800, true, true),
('Recuperación Activa', 'P160/C280/G70 — Anti-inflammatory focus with omega-3 emphasis', 'recovery', 2400, true, true),
('Ciclismo de Cargas', 'P200/C400/G60 — Carb cycling: high/medium/low day rotation', 'performance', 2900, true, true),
('Atleta Vegetariana', 'P150/C350/G75 — Plant-based complete proteins + B12/Iron/Zinc protocol', 'maintenance', 2600, true, true),
('Velocidad y Potencia', 'P210/C320/G75 — Sprinters/explosive athletes — creatine + caffeine protocol', 'performance', 3100, true, true),
('Control de Peso Femenino', 'P170/C220/G65 — Hormonal cycle-aware female athlete nutrition', 'cut', 2100, true, true),
('Ganancia Limpia', 'P200/C350/G80 — Lean bulk — caloric surplus +300 kcal above TDEE', 'bulk', 3200, true, true),
('Alto Rendimiento Juvenil', 'P160/C380/G70 — Youth athlete 14-18 yr growth-optimized protocol', 'performance', 2900, true, true)
ON CONFLICT DO NOTHING;
