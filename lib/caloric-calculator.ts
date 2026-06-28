export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';
export type Goal = 'lose_fat' | 'maintain' | 'gain_muscle';

export type StepsPerDay = 'under_3k' | 'steps_3k_7k' | 'steps_7k_10k' | 'over_10k';
export type JobType = 'desk' | 'driver' | 'standing' | 'physical';
export type DailyActivity = 'low' | 'moderate' | 'active';

// Base multipliers (exercise only)
const BASE_ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// NEAT bonus added ON TOP of base multiplier
function getNeatBonus(
  steps: StepsPerDay | undefined,
  job: JobType | undefined,
  daily: DailyActivity | undefined,
): number {
  const stepsScore: Record<StepsPerDay, number> = {
    under_3k: 0.0,
    steps_3k_7k: 0.05,
    steps_7k_10k: 0.1,
    over_10k: 0.15,
  };
  const jobScore: Record<JobType, number> = {
    desk: 0.0,
    driver: 0.05,
    standing: 0.1,
    physical: 0.2,
  };
  const dailyScore: Record<DailyActivity, number> = {
    low: 0.0,
    moderate: 0.05,
    active: 0.1,
  };
  return (
    (stepsScore[steps ?? 'under_3k'] ?? 0) +
    (jobScore[job ?? 'desk'] ?? 0) +
    (dailyScore[daily ?? 'low'] ?? 0)
  );
}

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose_fat: -500, // kcal deficit
  maintain: 0,
  gain_muscle: 300, // lean bulk surplus
};

export interface ClientData {
  age: number;
  sex: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
  has_body_comp: boolean;
  body_fat_pct?: number;
  lean_mass_kg?: number;
  steps_per_day?: StepsPerDay;
  job_type?: JobType;
  daily_activity?: DailyActivity;
}

export interface CaloricResult {
  formula_used: 'katch_mcardle' | 'mifflin_st_jeor';
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure
  target_kcal: number; // After goal adjustment
  breakdown: {
    base_multiplier: number; // exercise-only activity factor
    neat_bonus: number; // composite NEAT bonus added on top
    exercise_kcal: number; // kcal above BMR from structured exercise
    neat_kcal: number; // kcal above BMR from daily NEAT
    goal_adjustment: number; // goal deficit/surplus applied to TDEE
  };
  suggested_macros: {
    protein_g: number; // 2g/kg lean mass or 1.8g/kg body weight
    fat_g: number; // 25% of kcal
    carbs_g: number; // remainder
    protein_pct: number;
    carbs_pct: number;
    fat_pct: number;
  };
}

export function calculateCalories(data: ClientData): CaloricResult {
  let bmr: number;
  let formula_used: 'katch_mcardle' | 'mifflin_st_jeor';

  if (data.has_body_comp && data.lean_mass_kg) {
    // Katch-McArdle: most accurate when body composition is known
    bmr = 370 + 21.6 * data.lean_mass_kg;
    formula_used = 'katch_mcardle';
  } else {
    // Mifflin-St Jeor: best validated formula without body comp
    if (data.sex === 'male') {
      bmr =
        10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age + 5;
    } else {
      bmr =
        10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age - 161;
    }
    formula_used = 'mifflin_st_jeor';
  }

  const base_multiplier = BASE_ACTIVITY_MULTIPLIERS[data.activity_level];
  const neat_bonus = getNeatBonus(
    data.steps_per_day,
    data.job_type,
    data.daily_activity,
  );
  const totalMultiplier = base_multiplier + neat_bonus;
  const tdee = Math.round(bmr * totalMultiplier);
  const exercise_kcal = Math.round(bmr * (base_multiplier - 1));
  const neat_kcal = Math.round(bmr * neat_bonus);
  const goal_adjustment = GOAL_ADJUSTMENTS[data.goal];
  const target_kcal = Math.max(1200, tdee + goal_adjustment);

  // Macro distribution
  const lean_mass =
    data.lean_mass_kg ??
    data.weight_kg * (1 - (data.body_fat_pct ?? 20) / 100);
  const protein_g = Math.round(
    data.goal === 'gain_muscle' ? lean_mass * 2.2 : lean_mass * 2.0,
  );
  const fat_g = Math.round((target_kcal * 0.25) / 9);
  const carbs_g = Math.round((target_kcal - protein_g * 4 - fat_g * 9) / 4);

  const protein_pct = Math.round(((protein_g * 4) / target_kcal) * 100);
  const fat_pct = Math.round(((fat_g * 9) / target_kcal) * 100);
  const carbs_pct = 100 - protein_pct - fat_pct;

  return {
    formula_used,
    bmr: Math.round(bmr),
    tdee,
    target_kcal,
    breakdown: {
      base_multiplier,
      neat_bonus,
      exercise_kcal,
      neat_kcal,
      goal_adjustment,
    },
    suggested_macros: {
      protein_g,
      fat_g,
      carbs_g,
      protein_pct,
      carbs_pct,
      fat_pct,
    },
  };
}
