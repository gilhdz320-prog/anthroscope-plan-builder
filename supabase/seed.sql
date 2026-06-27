-- =============================================================================
-- Anthroscope Plan Builder — Seed Data
-- =============================================================================
-- Run via: supabase db reset  (runs schema.sql first, then this file)
-- No auth.users rows are seeded — those come from the signup flow.
-- Templates cannot reference a real user_id here, so they are not seeded;
-- the UI previews them as static data in app/dashboard/templates/page.tsx.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- System food equivalents (user_id = null → visible to all users)
-- Bilingual: English labels first, then Spanish labels.
-- Values are approximate standard exchange-list figures.
-- ---------------------------------------------------------------------------
insert into public.equivalents
  (user_id, group_name, food_name, serving_desc, serving_g, kcal, protein_g, carbs_g, fat_g)
values
  -- ── Cereals / Almidones (~80 kcal per exchange) ───────────────────────────
  (null, 'Cereals', 'White rice (cooked)',      '1/3 cup',       55,  80, 2, 15, 0),
  (null, 'Cereals', 'Corn tortilla',            '1 unit (30 g)', 30,  80, 2, 15, 1),
  (null, 'Cereals', 'Rolled oats (dry)',        '3 tbsp',        20,  80, 3, 15, 1),
  (null, 'Cereals', 'Whole wheat bread',        '1 slice',       30,  80, 3, 15, 1),
  (null, 'Cereals', 'Pasta (cooked)',           '1/3 cup',       55,  80, 3, 15, 0),

  (null, 'Almidones', 'Arroz blanco (cocido)',   '1/3 taza',     55,  80, 2, 15, 0),
  (null, 'Almidones', 'Tortilla de maíz',        '1 pieza (30 g)',30, 80, 2, 15, 1),
  (null, 'Almidones', 'Avena en hojuelas (seca)','3 cdas',       20,  80, 3, 15, 1),
  (null, 'Almidones', 'Pan integral',            '1 rebanada',   30,  80, 3, 15, 1),
  (null, 'Almidones', 'Pasta (cocida)',          '1/3 taza',     55,  80, 3, 15, 0),

  -- ── Proteins / Proteínas (~55–75 kcal per exchange, lean) ─────────────────
  (null, 'Proteins', 'Chicken breast (cooked)',  '30 g',         30,  55, 7,  0, 1),
  (null, 'Proteins', 'Tuna (canned in water)',   '30 g',         30,  55, 7,  0, 2),
  (null, 'Proteins', 'Egg white',                '2 units',      66,  55, 7,  0, 0),
  (null, 'Proteins', 'Cottage cheese (low fat)', '1/4 cup',      55,  55, 7,  2, 1),
  (null, 'Proteins', 'Salmon (cooked)',          '30 g',         30,  75, 7,  0, 5),

  (null, 'Proteínas', 'Pechuga de pollo (cocida)',  '30 g',      30,  55, 7,  0, 1),
  (null, 'Proteínas', 'Atún en agua',               '30 g',      30,  55, 7,  0, 2),
  (null, 'Proteínas', 'Clara de huevo',             '2 piezas',  66,  55, 7,  0, 0),
  (null, 'Proteínas', 'Queso cottage bajo en grasa','1/4 taza',  55,  55, 7,  2, 1),
  (null, 'Proteínas', 'Salmón (cocido)',            '30 g',      30,  75, 7,  0, 5),

  -- ── Vegetables / Verduras (~25 kcal per exchange) ─────────────────────────
  (null, 'Vegetables', 'Broccoli (cooked)',      '1/2 cup',      78,  25, 2, 5, 0),
  (null, 'Vegetables', 'Spinach (raw)',          '1 cup',        30,  25, 2, 4, 0),
  (null, 'Vegetables', 'Carrot (raw)',           '1/2 cup',      50,  25, 1, 6, 0),
  (null, 'Vegetables', 'Zucchini (cooked)',      '1/2 cup',      90,  25, 1, 5, 0),

  (null, 'Verduras', 'Brócoli (cocido)',          '1/2 taza',    78,  25, 2, 5, 0),
  (null, 'Verduras', 'Espinaca (cruda)',          '1 taza',      30,  25, 2, 4, 0),
  (null, 'Verduras', 'Zanahoria (cruda)',         '1/2 taza',    50,  25, 1, 6, 0),
  (null, 'Verduras', 'Calabacita (cocida)',       '1/2 taza',    90,  25, 1, 5, 0),

  -- ── Fruits / Frutas (~60 kcal per exchange) ───────────────────────────────
  (null, 'Fruits', 'Banana (small)',              '1/2 unit',    60,  60, 1, 15, 0),
  (null, 'Fruits', 'Apple (medium)',              '1 unit',     120,  60, 0, 15, 0),
  (null, 'Fruits', 'Strawberries',               '1 cup',      152,  60, 1, 15, 0),
  (null, 'Fruits', 'Orange (medium)',             '1 unit',     140,  60, 1, 15, 0),

  (null, 'Frutas', 'Plátano (pequeño)',           '1/2 pieza',   60,  60, 1, 15, 0),
  (null, 'Frutas', 'Manzana (mediana)',           '1 pieza',    120,  60, 0, 15, 0),
  (null, 'Frutas', 'Fresas',                     '1 taza',     152,  60, 1, 15, 0),
  (null, 'Frutas', 'Naranja (mediana)',           '1 pieza',    140,  60, 1, 15, 0),

  -- ── Dairy / Lácteos (~90–120 kcal per exchange) ───────────────────────────
  (null, 'Dairy',   'Skim milk',                  '1 cup',      240,  90, 8, 12, 0),
  (null, 'Dairy',   'Low-fat yogurt (plain)',      '3/4 cup',   180, 100, 8, 13, 2),
  (null, 'Dairy',   'Part-skim mozzarella',        '30 g',       30,  80, 7,  1, 5),

  (null, 'Lácteos', 'Leche descremada',            '1 taza',    240,  90, 8, 12, 0),
  (null, 'Lácteos', 'Yogur natural bajo en grasa', '3/4 taza',  180, 100, 8, 13, 2),
  (null, 'Lácteos', 'Mozzarella semidescremada',   '30 g',       30,  80, 7,  1, 5),

  -- ── Fats / Grasas (~45 kcal per exchange) ────────────────────────────────
  (null, 'Fats',   'Avocado',                     '1/8 unit',   30,  45, 0,  2, 5),
  (null, 'Fats',   'Olive oil',                   '1 tsp',       5,  45, 0,  0, 5),
  (null, 'Fats',   'Almonds',                     '6 units',    10,  45, 2,  2, 4),
  (null, 'Fats',   'Peanut butter (natural)',      '1/2 tbsp',   8,  45, 2,  1, 4),

  (null, 'Grasas', 'Aguacate',                    '1/8 pieza',  30,  45, 0,  2, 5),
  (null, 'Grasas', 'Aceite de oliva',             '1 cdita',     5,  45, 0,  0, 5),
  (null, 'Grasas', 'Almendras',                   '6 piezas',   10,  45, 2,  2, 4),
  (null, 'Grasas', 'Mantequilla de maní natural', '1/2 cda',     8,  45, 2,  1, 4)
;

-- =============================================================================
-- End of seed
-- =============================================================================
