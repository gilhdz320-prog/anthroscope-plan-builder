// Food equivalents / exchange list.
// The groups and items below mirror what is seeded in supabase/seed.sql
// so the page is useful even before the DB is connected.

const groups: { name: string; items: string[] }[] = [
  {
    name: 'Cereals / Almidones',
    items: [
      'White rice (cooked) — 1/3 cup · 80 kcal',
      'Corn tortilla — 1 unit (30 g) · 80 kcal',
      'Rolled oats (dry) — 3 tbsp · 80 kcal',
      'Whole wheat bread — 1 slice · 80 kcal',
      'Pasta (cooked) — 1/3 cup · 80 kcal',
    ],
  },
  {
    name: 'Proteins / Proteínas',
    items: [
      'Chicken breast (cooked) — 30 g · 55 kcal',
      'Tuna (canned in water) — 30 g · 55 kcal',
      'Egg white — 2 units · 55 kcal',
      'Cottage cheese (low fat) — 1/4 cup · 55 kcal',
      'Salmon (cooked) — 30 g · 75 kcal',
    ],
  },
  {
    name: 'Vegetables / Verduras',
    items: [
      'Broccoli (cooked) — 1/2 cup · 25 kcal',
      'Spinach (raw) — 1 cup · 25 kcal',
      'Carrot (raw) — 1/2 cup · 25 kcal',
      'Zucchini (cooked) — 1/2 cup · 25 kcal',
    ],
  },
  {
    name: 'Fruits / Frutas',
    items: [
      'Banana (small) — 1/2 unit · 60 kcal',
      'Apple (medium) — 1 unit · 60 kcal',
      'Strawberries — 1 cup · 60 kcal',
      'Orange (medium) — 1 unit · 60 kcal',
    ],
  },
  {
    name: 'Dairy / Lácteos',
    items: [
      'Skim milk — 1 cup · 90 kcal',
      'Low-fat yogurt (plain) — 3/4 cup · 100 kcal',
      'Part-skim mozzarella — 30 g · 80 kcal',
    ],
  },
  {
    name: 'Fats / Grasas',
    items: [
      'Avocado — 1/8 unit · 45 kcal',
      'Olive oil — 1 tsp · 45 kcal',
      'Almonds — 6 units · 45 kcal',
      'Peanut butter (natural) — 1/2 tbsp · 45 kcal',
    ],
  },
]

export default function EquivalentsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Equivalents</h1>
          <p className="mt-1 text-sm text-stone-500">
            Food exchange list used to build meal plans. Values are per serving.
          </p>
        </div>
        {/* Add custom equivalent — disabled until auth is ready */}
        <button
          type="button"
          disabled
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white opacity-40 cursor-not-allowed"
          title="Available once auth is set up"
        >
          + Add equivalent
        </button>
      </div>

      {/* Groups */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.name}
            className="rounded-xl border border-stone-200 bg-white"
          >
            <div className="border-b border-stone-100 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                {group.name}
              </h2>
            </div>
            <ul className="divide-y divide-stone-100">
              {group.items.map((item) => {
                const [food, details] = item.split(' — ')
                return (
                  <li key={item} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800">{food}</p>
                    <p className="mt-0.5 text-xs text-stone-400">{details}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-400">
        These system equivalents are seeded from{' '}
        <code className="rounded bg-stone-100 px-1 font-mono">
          supabase/seed.sql
        </code>
        . Custom equivalents you add will appear here alongside them.
      </p>
    </div>
  )
}
