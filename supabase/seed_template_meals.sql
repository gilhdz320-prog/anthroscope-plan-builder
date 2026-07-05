-- =============================================================================
-- Anthroscope Plan Builder — Seed template_meals with real foods
-- =============================================================================
-- This script populates template_meals for each seed template using foods
-- already in the equivalents table. Each template gets a full day of meals
-- (Desayuno, Colación matutina, Comida, Colación vespertina, Cena) with
-- appropriate foods and servings matching the template's kcal/macro targets.
--
-- Run in Supabase SQL Editor AFTER the templates and equivalents are seeded.
-- =============================================================================

-- Helper: We reference foods by food_name_es since IDs are auto-generated UUIDs.
-- The INSERT uses subqueries to look up the equivalent_id at runtime.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VELOCIDAD Y POTENCIA (3100 kcal, P210/C320/G75)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 2, 'Carbohidrato complejo'),
  ('Desayuno', 1, 'Clara de huevo', 3, 'Proteína magra'),
  ('Desayuno', 1, 'Plátano', 1, 'Fruta pre-entreno'),
  ('Desayuno', 1, 'Crema de cacahuate natural', 2, 'Grasa saludable'),
  ('Colación matutina', 2, 'Yogur griego sin grasa', 1, NULL),
  ('Colación matutina', 2, 'Manzana', 1, NULL),
  ('Colación matutina', 2, 'Almendras', 2, NULL),
  ('Comida', 3, 'Pechuga de pollo con piel cocida', 4, 'Proteína principal'),
  ('Comida', 3, 'Arroz blanco cocido', 3, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, 'Verdura'),
  ('Comida', 3, 'Aceite de oliva', 2, 'Grasa para cocinar'),
  ('Comida', 3, 'Frijol negro cocido', 1, 'Leguminosa'),
  ('Colación vespertina', 4, 'Tortilla de maíz', 2, NULL),
  ('Colación vespertina', 4, 'Atún en agua', 2, NULL),
  ('Colación vespertina', 4, 'Aguacate Hass', 1, NULL),
  ('Cena', 5, 'Salmón ahumado', 3, 'Omega-3'),
  ('Cena', 5, 'Camote cocido', 2, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, 'Verdura'),
  ('Cena', 5, 'Aceite de aguacate', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Velocidad y Potencia' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. GANANCIA LIMPIA (3200 kcal, P200/C350/G80)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 3, 'Base de carbohidratos'),
  ('Desayuno', 1, 'Huevo entero', 2, NULL),
  ('Desayuno', 1, 'Plátano', 1, NULL),
  ('Desayuno', 1, 'Crema de cacahuate natural', 2, NULL),
  ('Desayuno', 1, 'Leche descremada', 1, NULL),
  ('Colación matutina', 2, 'Arroz blanco cocido', 2, NULL),
  ('Colación matutina', 2, 'Pechuga de pollo con piel cocida', 2, NULL),
  ('Colación matutina', 2, 'Manzana', 1, NULL),
  ('Comida', 3, 'Bistec de res magro', 4, 'Proteína principal'),
  ('Comida', 3, 'Arroz blanco cocido', 3, NULL),
  ('Comida', 3, 'Frijol negro cocido', 1, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 2, NULL),
  ('Comida', 3, 'Tortilla de maíz', 2, NULL),
  ('Colación vespertina', 4, 'Yogur griego sin grasa', 1, NULL),
  ('Colación vespertina', 4, 'Almendras', 2, NULL),
  ('Colación vespertina', 4, 'Naranja', 1, NULL),
  ('Cena', 5, 'Salmón ahumado', 3, NULL),
  ('Cena', 5, 'Camote cocido', 2, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aguacate Hass', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Ganancia Limpia' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ATLETA VEGETARIANA (2600 kcal, P150/C350/G75)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 2, NULL),
  ('Desayuno', 1, 'Leche descremada', 1, NULL),
  ('Desayuno', 1, 'Plátano', 1, NULL),
  ('Desayuno', 1, 'Crema de cacahuate natural', 2, NULL),
  ('Desayuno', 1, 'Semillas de chía', 1, 'Omega-3 vegetal'),
  ('Colación matutina', 2, 'Yogur griego sin grasa', 1, NULL),
  ('Colación matutina', 2, 'Manzana', 1, NULL),
  ('Colación matutina', 2, 'Nueces de la India', 2, NULL),
  ('Comida', 3, 'Lenteja cocida', 2, 'Proteína vegetal'),
  ('Comida', 3, 'Arroz blanco cocido', 3, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 2, NULL),
  ('Comida', 3, 'Aguacate Hass', 1, NULL),
  ('Colación vespertina', 4, 'Garbanzo cocido', 1, NULL),
  ('Colación vespertina', 4, 'Tortilla de maíz', 2, NULL),
  ('Colación vespertina', 4, 'Naranja', 1, NULL),
  ('Cena', 5, 'Tofu firme', 3, 'Proteína vegetal'),
  ('Cena', 5, 'Quinoa cocida', 2, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aceite de aguacate', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Atleta Vegetariana' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FUERZA FUNCIONAL (2800 kcal, P190/C300/G80)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Huevo entero', 3, NULL),
  ('Desayuno', 1, 'Tortilla de maíz', 2, NULL),
  ('Desayuno', 1, 'Frijol negro cocido', 1, NULL),
  ('Desayuno', 1, 'Aguacate Hass', 1, NULL),
  ('Colación matutina', 2, 'Yogur griego sin grasa', 1, NULL),
  ('Colación matutina', 2, 'Plátano', 1, NULL),
  ('Colación matutina', 2, 'Almendras', 2, NULL),
  ('Comida', 3, 'Pechuga de pollo con piel cocida', 4, NULL),
  ('Comida', 3, 'Arroz blanco cocido', 3, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 2, NULL),
  ('Comida', 3, 'Lenteja cocida', 1, NULL),
  ('Colación vespertina', 4, 'Camote cocido', 2, NULL),
  ('Colación vespertina', 4, 'Atún en agua', 2, NULL),
  ('Colación vespertina', 4, 'Manzana', 1, NULL),
  ('Cena', 5, 'Bistec de res magro', 3, NULL),
  ('Cena', 5, 'Quinoa cocida', 2, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aceite de aguacate', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Fuerza Funcional' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RESISTENCIA AERÓBICA ELITE (3200 kcal, P180/C520/G70)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 3, 'Carga de carbohidratos'),
  ('Desayuno', 1, 'Plátano', 2, NULL),
  ('Desayuno', 1, 'Leche descremada', 1, NULL),
  ('Desayuno', 1, 'Miel de abeja', 1, 'Energía rápida'),
  ('Colación matutina', 2, 'Arroz blanco cocido', 2, NULL),
  ('Colación matutina', 2, 'Pechuga de pollo con piel cocida', 2, NULL),
  ('Colación matutina', 2, 'Naranja', 1, NULL),
  ('Comida', 3, 'Pasta cocida', 4, 'Carga glucógeno'),
  ('Comida', 3, 'Pechuga de pollo con piel cocida', 3, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 2, NULL),
  ('Comida', 3, 'Frijol negro cocido', 1, NULL),
  ('Colación vespertina', 4, 'Camote cocido', 3, NULL),
  ('Colación vespertina', 4, 'Yogur griego sin grasa', 1, NULL),
  ('Colación vespertina', 4, 'Manzana', 1, NULL),
  ('Cena', 5, 'Salmón ahumado', 3, NULL),
  ('Cena', 5, 'Arroz blanco cocido', 3, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aguacate Hass', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Resistencia Aeróbica Elite' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. DEFINICIÓN COMPETITIVA (1900 kcal, P220/C180/G55)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Clara de huevo', 4, 'Proteína alta, grasa baja'),
  ('Desayuno', 1, 'Avena cocida', 1, NULL),
  ('Desayuno', 1, 'Manzana verde', 1, NULL),
  ('Colación matutina', 2, 'Pechuga de pollo con piel cocida', 2, NULL),
  ('Colación matutina', 2, 'Pepino', 2, 'Bajo en calorías'),
  ('Comida', 3, 'Pechuga de pollo con piel cocida', 4, NULL),
  ('Comida', 3, 'Arroz blanco cocido', 2, NULL),
  ('Comida', 3, 'Brócoli cocido', 3, 'Volumen sin calorías'),
  ('Comida', 3, 'Aceite de oliva', 1, NULL),
  ('Colación vespertina', 4, 'Yogur griego sin grasa', 1, NULL),
  ('Colación vespertina', 4, 'Almendras', 1, NULL),
  ('Cena', 5, 'Atún en agua', 3, NULL),
  ('Cena', 5, 'Espinaca cocida', 3, NULL),
  ('Cena', 5, 'Aguacate Hass', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Definición Competitiva' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. HIPERTROFIA MÁXIMA (3800 kcal, P240/C380/G90)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 3, NULL),
  ('Desayuno', 1, 'Huevo entero', 3, NULL),
  ('Desayuno', 1, 'Plátano', 2, NULL),
  ('Desayuno', 1, 'Crema de cacahuate natural', 3, NULL),
  ('Desayuno', 1, 'Leche descremada', 1, NULL),
  ('Colación matutina', 2, 'Arroz blanco cocido', 3, NULL),
  ('Colación matutina', 2, 'Pechuga de pollo con piel cocida', 3, NULL),
  ('Colación matutina', 2, 'Manzana', 1, NULL),
  ('Comida', 3, 'Bistec de res magro', 5, NULL),
  ('Comida', 3, 'Arroz blanco cocido', 4, NULL),
  ('Comida', 3, 'Frijol negro cocido', 1, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 3, NULL),
  ('Comida', 3, 'Tortilla de maíz', 2, NULL),
  ('Colación vespertina', 4, 'Camote cocido', 3, NULL),
  ('Colación vespertina', 4, 'Atún en agua', 3, NULL),
  ('Colación vespertina', 4, 'Aguacate Hass', 1, NULL),
  ('Colación vespertina', 4, 'Naranja', 1, NULL),
  ('Cena', 5, 'Salmón ahumado', 4, NULL),
  ('Cena', 5, 'Quinoa cocida', 2, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aceite de aguacate', 2, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Hipertrofia Máxima' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RECUPERACIÓN ACTIVA (2400 kcal, P160/C280/G70)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 2, NULL),
  ('Desayuno', 1, 'Huevo entero', 2, NULL),
  ('Desayuno', 1, 'Manzana', 1, NULL),
  ('Desayuno', 1, 'Semillas de chía', 1, 'Antiinflamatorio'),
  ('Colación matutina', 2, 'Yogur griego sin grasa', 1, NULL),
  ('Colación matutina', 2, 'Plátano', 1, NULL),
  ('Colación matutina', 2, 'Nuez de nogal', 2, 'Omega-3'),
  ('Comida', 3, 'Salmón ahumado', 3, 'Omega-3 antiinflamatorio'),
  ('Comida', 3, 'Arroz blanco cocido', 3, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 2, NULL),
  ('Comida', 3, 'Lenteja cocida', 1, NULL),
  ('Colación vespertina', 4, 'Camote cocido', 2, NULL),
  ('Colación vespertina', 4, 'Atún en agua', 2, NULL),
  ('Colación vespertina', 4, 'Naranja', 1, 'Vitamina C'),
  ('Cena', 5, 'Pechuga de pollo con piel cocida', 3, NULL),
  ('Cena', 5, 'Quinoa cocida', 2, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aguacate Hass', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Recuperación Activa' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. CICLISMO DE CARGAS (2900 kcal, P200/C400/G60)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 3, 'Día alto en carbos'),
  ('Desayuno', 1, 'Plátano', 1, NULL),
  ('Desayuno', 1, 'Huevo entero', 2, NULL),
  ('Desayuno', 1, 'Leche descremada', 1, NULL),
  ('Colación matutina', 2, 'Arroz blanco cocido', 2, NULL),
  ('Colación matutina', 2, 'Pechuga de pollo con piel cocida', 2, NULL),
  ('Colación matutina', 2, 'Manzana', 1, NULL),
  ('Comida', 3, 'Pechuga de pollo con piel cocida', 4, NULL),
  ('Comida', 3, 'Pasta cocida', 4, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 1, NULL),
  ('Comida', 3, 'Frijol negro cocido', 1, NULL),
  ('Colación vespertina', 4, 'Camote cocido', 3, NULL),
  ('Colación vespertina', 4, 'Yogur griego sin grasa', 1, NULL),
  ('Colación vespertina', 4, 'Naranja', 1, NULL),
  ('Cena', 5, 'Bistec de res magro', 3, NULL),
  ('Cena', 5, 'Arroz blanco cocido', 2, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aguacate Hass', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Ciclismo de Cargas' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. CONTROL DE PESO FEMENINO (2100 kcal, P170/C220/G65)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 2, NULL),
  ('Desayuno', 1, 'Clara de huevo', 3, NULL),
  ('Desayuno', 1, 'Manzana', 1, NULL),
  ('Desayuno', 1, 'Semillas de chía', 1, NULL),
  ('Colación matutina', 2, 'Yogur griego sin grasa', 1, NULL),
  ('Colación matutina', 2, 'Almendras', 1, NULL),
  ('Colación matutina', 2, 'Naranja', 1, NULL),
  ('Comida', 3, 'Pechuga de pollo con piel cocida', 3, NULL),
  ('Comida', 3, 'Arroz blanco cocido', 2, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 1, NULL),
  ('Comida', 3, 'Lenteja cocida', 1, NULL),
  ('Colación vespertina', 4, 'Camote cocido', 1, NULL),
  ('Colación vespertina', 4, 'Atún en agua', 2, NULL),
  ('Colación vespertina', 4, 'Pepino', 2, NULL),
  ('Cena', 5, 'Salmón ahumado', 2, NULL),
  ('Cena', 5, 'Quinoa cocida', 1, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aguacate Hass', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Control de Peso Femenino' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. ALTO RENDIMIENTO JUVENIL (2900 kcal, P160/C380/G70)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.template_meals (template_id, meal_name, meal_order, equivalent_id, servings, notes)
SELECT t.id, m.meal_name, m.meal_order, e.id, m.servings, m.notes
FROM public.templates t
CROSS JOIN (VALUES
  ('Desayuno', 1, 'Avena cocida', 2, NULL),
  ('Desayuno', 1, 'Huevo entero', 2, NULL),
  ('Desayuno', 1, 'Plátano', 1, NULL),
  ('Desayuno', 1, 'Leche descremada', 1, NULL),
  ('Desayuno', 1, 'Crema de cacahuate natural', 1, NULL),
  ('Colación matutina', 2, 'Yogur griego sin grasa', 1, NULL),
  ('Colación matutina', 2, 'Manzana', 1, NULL),
  ('Colación matutina', 2, 'Almendras', 1, NULL),
  ('Comida', 3, 'Pechuga de pollo con piel cocida', 3, NULL),
  ('Comida', 3, 'Arroz blanco cocido', 4, NULL),
  ('Comida', 3, 'Frijol negro cocido', 1, NULL),
  ('Comida', 3, 'Brócoli cocido', 2, NULL),
  ('Comida', 3, 'Aceite de oliva', 2, NULL),
  ('Comida', 3, 'Tortilla de maíz', 2, NULL),
  ('Colación vespertina', 4, 'Camote cocido', 2, NULL),
  ('Colación vespertina', 4, 'Atún en agua', 2, NULL),
  ('Colación vespertina', 4, 'Naranja', 1, NULL),
  ('Cena', 5, 'Salmón ahumado', 3, NULL),
  ('Cena', 5, 'Quinoa cocida', 2, NULL),
  ('Cena', 5, 'Espinaca cocida', 2, NULL),
  ('Cena', 5, 'Aguacate Hass', 1, NULL)
) AS m(meal_name, meal_order, food_name, servings, notes)
JOIN public.equivalents e ON e.food_name_es = m.food_name AND e.user_id IS NULL
WHERE t.name = 'Alto Rendimiento Juvenil' AND t.is_seed = true
ON CONFLICT DO NOTHING;

-- =============================================================================
-- End of seed_template_meals.sql
-- =============================================================================
