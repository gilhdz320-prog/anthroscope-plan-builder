import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type React from "react";
import {
  EQUIVALENTES_GRUPOS,
  GRUPO_KEYS,
  type Equivalentes,
} from "@/lib/equivalentes";

// Register Google Fonts via direct woff/ttf URLs (react-pdf supports TTF)
// Fraunces (display serif) + Inter (sans) + JetBrains Mono (mono)
Font.register({
  family: "Fraunces",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-400-normal.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-500-normal.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-400-italic.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
  ],
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf",
      fontWeight: 600,
    },
  ],
});

// Disable hyphenation
Font.registerHyphenationCallback((word) => [word]);

// ──────────── Color tokens ────────────
const COLORS = {
  ivory: "#FAFAF8",
  paper: "#FFFFFF",
  sunken: "#F0EBE0",
  inkStrong: "#0E1410",
  ink: "#1B2520",
  inkMuted: "#5A655F",
  inkSubtle: "#8A938D",
  brand: "#0F7B5C",
  brandDeep: "#053024",
  gold: "#c9a961",
  goldDeep: "#7E6322",
  border: "#D9D2C0",
  borderSubtle: "#ECE6D8",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.ivory,
    padding: 56,
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.45,
  },
  // ─── Cover ───
  coverPage: {
    backgroundColor: COLORS.inkStrong,
    color: COLORS.ivory,
    padding: 56,
    fontFamily: "Inter",
    position: "relative",
  },
  coverGoldAccent: {
    position: "absolute",
    top: 0,
    left: 56,
    right: 56,
    height: 3,
    backgroundColor: COLORS.gold,
  },
  coverEyebrow: {
    fontSize: 8,
    letterSpacing: 3,
    color: COLORS.gold,
    textTransform: "uppercase",
    marginBottom: 30,
  },
  coverBrand: {
    fontFamily: "Fraunces",
    fontSize: 14,
    color: COLORS.ivory,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  coverBrandItalic: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    fontSize: 14,
    color: COLORS.gold,
    letterSpacing: -0.3,
  },
  coverTitle: {
    fontFamily: "Fraunces",
    fontSize: 44,
    color: COLORS.ivory,
    letterSpacing: -1.2,
    lineHeight: 1.05,
    marginTop: 180,
  },
  coverTitleItalic: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    color: COLORS.gold,
  },
  coverPatient: {
    marginTop: 28,
    fontSize: 14,
    color: COLORS.ivory,
    letterSpacing: 0.2,
  },
  coverMeta: {
    fontSize: 10,
    color: "#9CA39D",
    marginTop: 6,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  coverFooter: {
    position: "absolute",
    bottom: 56,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 0.5,
    borderTopColor: "#3A4540",
    paddingTop: 18,
  },
  coverFooterLabel: {
    fontSize: 8,
    color: "#9CA39D",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  coverFooterValue: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    fontSize: 12,
    color: COLORS.gold,
    marginTop: 4,
  },
  // ─── Content page ───
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 24,
  },
  pageBrand: {
    fontFamily: "Fraunces",
    fontSize: 13,
    color: COLORS.inkStrong,
    letterSpacing: -0.3,
  },
  pageHeaderRight: {
    fontSize: 8,
    color: COLORS.inkMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  // Section
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2.4,
    color: COLORS.gold,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  h1: {
    fontFamily: "Fraunces",
    fontSize: 26,
    color: COLORS.inkStrong,
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  h2: {
    fontFamily: "Fraunces",
    fontSize: 18,
    color: COLORS.inkStrong,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  mealName: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    fontSize: 16,
    color: COLORS.brandDeep,
  },
  body: {
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.55,
  },
  muted: {
    fontSize: 9,
    color: COLORS.inkMuted,
  },
  subtle: {
    fontSize: 8,
    color: COLORS.inkSubtle,
  },
  // Patient strip
  patientCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 0.5,
    borderColor: COLORS.borderSubtle,
    borderRadius: 6,
    padding: 16,
    marginBottom: 22,
  },
  patientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  patientCell: {
    flex: 1,
  },
  patientLabel: {
    fontSize: 7,
    letterSpacing: 1.6,
    color: COLORS.inkSubtle,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  patientValue: {
    fontFamily: "Fraunces",
    fontSize: 14,
    color: COLORS.inkStrong,
    letterSpacing: -0.2,
  },
  // Macros card
  macrosCard: {
    flexDirection: "row",
    backgroundColor: COLORS.inkStrong,
    borderRadius: 6,
    padding: 18,
    marginBottom: 24,
    color: COLORS.ivory,
  },
  macroCell: {
    flex: 1,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: "#3A4540",
  },
  macroCellLast: {
    flex: 1,
    paddingHorizontal: 4,
  },
  macroLabel: {
    fontSize: 7,
    letterSpacing: 1.6,
    color: COLORS.gold,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  macroValue: {
    fontFamily: "Fraunces",
    fontSize: 22,
    color: COLORS.ivory,
    letterSpacing: -0.8,
  },
  macroUnit: {
    fontSize: 9,
    color: "#9CA39D",
  },
  // Meals
  mealBlock: {
    marginBottom: 18,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: 14,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  itemName: {
    flex: 3,
    fontSize: 10,
    color: COLORS.ink,
  },
  itemServing: {
    flex: 2,
    fontSize: 9,
    color: COLORS.inkMuted,
    textAlign: "right",
  },
  itemKcal: {
    flex: 1,
    fontSize: 9,
    color: COLORS.inkMuted,
    textAlign: "right",
    fontFamily: "Inter",
  },
  // Equivalentes table
  eqTable: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 6,
    marginBottom: 24,
    overflow: "hidden",
  },
  eqHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.gold,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  eqHeaderCell: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: COLORS.inkStrong,
    textTransform: "uppercase",
    fontFamily: "Inter",
  },
  eqRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderSubtle,
    backgroundColor: COLORS.paper,
  },
  eqTotalRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gold,
    backgroundColor: COLORS.sunken,
  },
  eqGroupCell: {
    flex: 3,
    fontSize: 9,
    color: COLORS.ink,
  },
  eqNumCell: {
    flex: 1,
    fontSize: 9,
    color: COLORS.inkMuted,
    textAlign: "right",
  },
  eqTotalLabel: {
    flex: 3,
    fontFamily: "Fraunces",
    fontSize: 10,
    color: COLORS.goldDeep,
  },
  eqTotalNum: {
    flex: 1,
    fontSize: 9,
    color: COLORS.goldDeep,
    textAlign: "right",
    fontFamily: "Inter",
  },
  // Notes
  notesBox: {
    backgroundColor: COLORS.sunken,
    borderRadius: 6,
    padding: 14,
    marginTop: 12,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 36,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.inkSubtle,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  footerBrand: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    fontSize: 9,
    color: COLORS.goldDeep,
    letterSpacing: -0.2,
  },
  pageNum: {
    fontSize: 7,
    color: COLORS.inkSubtle,
    fontFamily: "Inter",
  },
  // ─── Branded header (nutritionist) ───
  brandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  brandHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogo: {
    width: 42,
    height: 42,
    objectFit: "contain",
    marginRight: 12,
  },
  brandName: {
    fontFamily: "Fraunces",
    fontSize: 15,
    color: COLORS.inkStrong,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  brandHeaderRight: {
    alignItems: "flex-end",
    maxWidth: 220,
  },
  brandContact: {
    fontSize: 8,
    color: COLORS.inkMuted,
    textAlign: "right",
  },
  accentBar: {
    height: 3,
    borderRadius: 2,
    marginBottom: 22,
  },
  // ─── Energy table ───
  energyTable: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 6,
    marginBottom: 24,
    overflow: "hidden",
  },
  energyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderSubtle,
    backgroundColor: COLORS.paper,
  },
  energyRowFirst: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: COLORS.paper,
  },
  energyLabel: {
    fontSize: 9,
    color: COLORS.inkMuted,
  },
  energyValue: {
    fontSize: 9,
    color: COLORS.inkStrong,
    fontFamily: "Inter",
  },
  energyFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    backgroundColor: COLORS.sunken,
  },
  energyFinalLabel: {
    fontFamily: "Fraunces",
    fontSize: 11,
    color: COLORS.inkStrong,
  },
  energyFinalValue: {
    fontFamily: "Fraunces",
    fontSize: 12,
  },
  // ─── Intercambios reference ───
  interBlock: {
    borderWidth: 0.5,
    borderColor: COLORS.borderSubtle,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.paper,
  },
  interHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  interTitle: {
    fontFamily: "Fraunces",
    fontSize: 12,
    color: COLORS.inkStrong,
  },
  interMacros: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginBottom: 6,
  },
  interFoodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  interFoodName: {
    flex: 3,
    fontSize: 9,
    color: COLORS.ink,
  },
  interFoodServing: {
    flex: 2,
    fontSize: 8,
    color: COLORS.inkMuted,
    textAlign: "right",
  },
  // ─── Signature footer ───
  signBlock: {
    marginTop: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signCol: {
    width: 220,
  },
  signImage: {
    height: 40,
    objectFit: "contain",
    marginBottom: 4,
  },
  signLine: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.ink,
    marginTop: 40,
    paddingTop: 4,
  },
  signLabel: {
    fontSize: 8,
    color: COLORS.inkMuted,
  },
  signName: {
    fontFamily: "Fraunces",
    fontSize: 11,
    color: COLORS.inkStrong,
  },
});

// ─── Types ───
export interface PlanPdfData {
  plan: {
    id: string;
    title: string;
    status: string;
    valid_from: string | null;
    valid_until: string | null;
    notes: string | null;
    created_at: string;
  };
  patient: {
    first_name: string;
    last_name: string;
    sex: string | null;
    birth_date: string | null;
    sport: string | null;
    goal: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    body_fat_pct?: number | null;
    lean_mass_kg?: number | null;
  } | null;
  meals: Array<{
    id: string;
    meal_name: string;
    meal_order: number;
    notes: string | null;
    servings: number;
    equivalent: {
      food_name: string | null;
      food_name_es: string | null;
      food_name_en: string | null;
      serving_desc: string | null;
      serving_desc_es: string | null;
      serving_desc_en: string | null;
      kcal: number | null;
      protein_g: number | null;
      carbs_g: number | null;
      fat_g: number | null;
    } | null;
  }>;
  practitioner: {
    full_name: string | null;
    email: string | null;
  };
  equivalentes?: {
    mode?: string;
    kcalTarget?: number;
    groups?: Equivalentes | null;
  } | null;
  profile?: {
    clinic_name: string | null;
    professional_name: string | null;
    license_number: string | null;
    specialty: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    accent_color: string | null;
    logo_url: string | null;
    signature_url: string | null;
  } | null;
  energy?: {
    formula: "katch_mcardle" | "mifflin_st_jeor";
    bmr: number;
    activityFactor: number;
    tdee: number;
    goalAdjustment: number;
    finalKcal: number;
    waterMl: number;
    protein: { g: number; pct: number };
    carbs: { g: number; pct: number };
    fat: { g: number; pct: number };
  } | null;
  intercambios?: Array<{
    key: string;
    label: string;
    equivalents: number;
    perEquiv: { kcal: number; protein: number; carbs: number; fat: number };
    foods: Array<{ name: string; serving: string }>;
  }> | null;
}

const sexLabel: Record<string, string> = {
  female: "Femenino",
  male: "Masculino",
  other: "Otro",
};
const goalLabel: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  muscle_gain: "Ganancia muscular",
  performance: "Rendimiento",
};

function ageFrom(birth: string | null): string {
  if (!birth) return "—";
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return "—";
  const ageMs = Date.now() - b.getTime();
  const years = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
  return `${years} años`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function bmiOf(weight: number | null, height: number | null): string {
  if (!weight || !height) return "—";
  const m = height / 100;
  if (m <= 0) return "—";
  return (weight / (m * m)).toFixed(1);
}

const formulaLabel: Record<string, string> = {
  katch_mcardle: "Katch-McArdle",
  mifflin_st_jeor: "Mifflin-St Jeor",
};

// Aggregate macros across meals
function aggregateMacros(meals: PlanPdfData["meals"]) {
  let kcal = 0,
    protein = 0,
    carbs = 0,
    fat = 0;
  for (const m of meals) {
    const e = m.equivalent;
    if (!e) continue;
    const s = m.servings || 1;
    kcal += (e.kcal ?? 0) * s;
    protein += (e.protein_g ?? 0) * s;
    carbs += (e.carbs_g ?? 0) * s;
    fat += (e.fat_g ?? 0) * s;
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

// Group meals by meal_name
function groupMeals(meals: PlanPdfData["meals"]) {
  const groups: Record<
    string,
    { order: number; items: PlanPdfData["meals"]; notes: string | null }
  > = {};
  for (const m of meals) {
    const key = m.meal_name || "Comida";
    if (!groups[key]) {
      groups[key] = { order: m.meal_order, items: [], notes: m.notes };
    }
    groups[key].items.push(m);
  }
  return Object.entries(groups)
    .map(([name, g]) => ({ name, ...g }))
    .sort((a, b) => a.order - b.order);
}

function eqMacros(groups: Equivalentes) {
  let kcal = 0;
  for (const key of GRUPO_KEYS) {
    kcal += EQUIVALENTES_GRUPOS[key].kcal * (groups[key] ?? 0);
  }
  return Math.round(kcal);
}

export const PlanPdf: React.FC<{ data: PlanPdfData }> = ({ data }) => {
  const { plan, patient, meals, practitioner, equivalentes, profile, energy, intercambios } =
    data;
  const macros = aggregateMacros(meals);
  const grouped = groupMeals(meals);
  const eqGroups = equivalentes?.groups ?? null;
  const hasEquivalentes =
    !!eqGroups && GRUPO_KEYS.some((k) => (eqGroups[k] ?? 0) > 0);
  const eqTotalKcal = eqGroups ? eqMacros(eqGroups) : 0;
  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : "Paciente";

  const accent = profile?.accent_color || COLORS.gold;
  const headerName =
    profile?.professional_name ??
    practitioner.full_name ??
    practitioner.email ??
    "Anthroscope";
  const hasInter = !!intercambios && intercambios.length > 0;

  // Branded header shown fixed at the top of every content page.
  const BrandHeader = () => (
    <View fixed>
      <View style={styles.brandHeader}>
        <View style={styles.brandHeaderLeft}>
          {profile?.logo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={profile.logo_url} style={styles.brandLogo} />
          ) : null}
          <View>
            <Text style={styles.brandName}>
              {profile?.clinic_name ?? headerName}
            </Text>
            {profile?.clinic_name && headerName !== profile.clinic_name ? (
              <Text style={styles.brandSub}>{headerName}</Text>
            ) : profile?.specialty ? (
              <Text style={styles.brandSub}>{profile.specialty}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.brandHeaderRight}>
          {profile?.specialty && profile?.clinic_name ? (
            <Text style={styles.brandContact}>{profile.specialty}</Text>
          ) : null}
          {profile?.license_number ? (
            <Text style={styles.brandContact}>Céd. {profile.license_number}</Text>
          ) : null}
          {profile?.phone ? (
            <Text style={styles.brandContact}>{profile.phone}</Text>
          ) : null}
          {profile?.website ? (
            <Text style={styles.brandContact}>{profile.website}</Text>
          ) : null}
        </View>
      </View>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
    </View>
  );

  // Signature / next-appointment block for the end of the plan.
  const SignatureBlock = () => (
    <View style={styles.signBlock} wrap={false}>
      <View style={styles.signCol}>
        <Text style={styles.signLabel}>Próxima cita · Next appointment</Text>
        <View style={styles.signLine}>
          <Text style={styles.signLabel}> </Text>
        </View>
      </View>
      <View style={[styles.signCol, { alignItems: "flex-end" }]}>
        {profile?.signature_url ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={profile.signature_url} style={styles.signImage} />
        ) : (
          <View style={{ height: 40 }} />
        )}
        <View style={[styles.signLine, { marginTop: 0, width: "100%" }]}>
          <Text style={[styles.signName, { textAlign: "right" }]}>
            {headerName}
          </Text>
          {profile?.license_number ? (
            <Text style={[styles.signLabel, { textAlign: "right" }]}>
              Cédula profesional {profile.license_number}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <Document
      title={plan.title}
      author={practitioner.full_name ?? "Anthroscope Plan Builder"}
      creator="Anthroscope Plan Builder"
      producer="Anthroscope Plan Builder"
    >
      {/* ─── Cover ─── */}
      <Page size="LETTER" style={styles.coverPage}>
        <View style={styles.coverGoldAccent} />
        <Text style={styles.coverEyebrow}>Plan de nutrición · 2026</Text>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.coverBrand}>Anthroscope </Text>
          <Text style={styles.coverBrandItalic}>Plan Builder</Text>
        </View>

        <Text style={styles.coverTitle}>
          {plan.title}
          {"\n"}
          <Text style={styles.coverTitleItalic}>preparado para ti</Text>
          {"."}
        </Text>

        <Text style={styles.coverPatient}>{patientName}</Text>
        <Text style={styles.coverMeta}>
          {patient?.sport ?? "—"} · {fmtDate(plan.valid_from)} ›{" "}
          {fmtDate(plan.valid_until)}
        </Text>

        <View style={styles.coverFooter}>
          <View>
            <Text style={styles.coverFooterLabel}>Preparado por</Text>
            <Text style={styles.coverFooterValue}>
              {practitioner.full_name ?? practitioner.email ?? "Tu nutriólogo"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.coverFooterLabel}>Powered by</Text>
            <Text style={styles.coverFooterValue}>Anthroscope</Text>
          </View>
        </View>
      </Page>

      {/* ─── Overview ─── */}
      <Page size="LETTER" style={styles.page}>
        <BrandHeader />

        <Text style={[styles.eyebrow, { color: accent }]}>Resumen</Text>
        <Text style={styles.h1}>Plan · {plan.title}</Text>
        <Text style={[styles.muted, { marginBottom: 22 }]}>
          Estado:{" "}
          {plan.status === "active"
            ? "Activo"
            : plan.status === "archived"
            ? "Archivado"
            : "Borrador"}{" "}
          · Generado el {fmtDate(new Date().toISOString())}
        </Text>

        {/* Patient strip */}
        {patient && (
          <View style={styles.patientCard}>
            <View style={styles.patientRow}>
              <View style={styles.patientCell}>
                <Text style={styles.patientLabel}>Paciente</Text>
                <Text style={styles.patientValue}>{patientName}</Text>
              </View>
              <View style={styles.patientCell}>
                <Text style={styles.patientLabel}>Edad / Sexo</Text>
                <Text style={styles.patientValue}>
                  {ageFrom(patient.birth_date)} ·{" "}
                  {patient.sex ? sexLabel[patient.sex] ?? patient.sex : "—"}
                </Text>
              </View>
              <View style={styles.patientCell}>
                <Text style={styles.patientLabel}>Peso · Estatura</Text>
                <Text style={styles.patientValue}>
                  {patient.weight_kg ? `${patient.weight_kg} kg` : "—"} ·{" "}
                  {patient.height_cm ? `${patient.height_cm} cm` : "—"}
                </Text>
              </View>
              <View style={styles.patientCell}>
                <Text style={styles.patientLabel}>Objetivo</Text>
                <Text style={styles.patientValue}>
                  {patient.goal
                    ? goalLabel[patient.goal] ?? patient.goal
                    : "—"}
                </Text>
              </View>
            </View>
            <View style={[styles.patientRow, { marginTop: 14 }]}>
              <View style={styles.patientCell}>
                <Text style={styles.patientLabel}>Deporte</Text>
                <Text style={styles.patientValue}>{patient.sport ?? "—"}</Text>
              </View>
              <View style={styles.patientCell}>
                <Text style={styles.patientLabel}>IMC · BMI</Text>
                <Text style={styles.patientValue}>
                  {bmiOf(patient.weight_kg, patient.height_cm)}
                </Text>
              </View>
              <View style={styles.patientCell}>
                <Text style={styles.patientLabel}>% Grasa · Masa magra</Text>
                <Text style={styles.patientValue}>
                  {patient.body_fat_pct != null
                    ? `${patient.body_fat_pct}%`
                    : "—"}{" "}
                  ·{" "}
                  {patient.lean_mass_kg != null
                    ? `${patient.lean_mass_kg} kg`
                    : "—"}
                </Text>
              </View>
              <View style={styles.patientCell}>
                <Text style={styles.patientLabel}>Fórmula</Text>
                <Text style={styles.patientValue}>
                  {energy ? formulaLabel[energy.formula] ?? energy.formula : "—"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Energy requirements */}
        {energy && (
          <View wrap={false}>
            <Text style={[styles.eyebrow, { color: accent }]}>
              Requerimiento energético
            </Text>
            <View style={styles.energyTable}>
              <View style={styles.energyRowFirst}>
                <Text style={styles.energyLabel}>
                  Metabolismo basal (BMR) · {formulaLabel[energy.formula] ?? energy.formula}
                </Text>
                <Text style={styles.energyValue}>{energy.bmr} kcal</Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>Factor de actividad</Text>
                <Text style={styles.energyValue}>
                  × {energy.activityFactor.toFixed(2)}
                </Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>Gasto total (TDEE)</Text>
                <Text style={styles.energyValue}>{energy.tdee} kcal</Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>Ajuste por objetivo</Text>
                <Text style={styles.energyValue}>
                  {energy.goalAdjustment >= 0 ? "+" : ""}
                  {energy.goalAdjustment} kcal
                </Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>Proteína</Text>
                <Text style={styles.energyValue}>
                  {energy.protein.g} g · {energy.protein.pct}%
                </Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>Carbohidratos</Text>
                <Text style={styles.energyValue}>
                  {energy.carbs.g} g · {energy.carbs.pct}%
                </Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>Lípidos</Text>
                <Text style={styles.energyValue}>
                  {energy.fat.g} g · {energy.fat.pct}%
                </Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>Agua recomendada</Text>
                <Text style={styles.energyValue}>
                  {(energy.waterMl / 1000).toFixed(1)} L
                </Text>
              </View>
              <View style={[styles.energyFinal, { borderTopColor: accent }]}>
                <Text style={styles.energyFinalLabel}>
                  Calorías objetivo · Final
                </Text>
                <Text style={[styles.energyFinalValue, { color: accent }]}>
                  {energy.finalKcal.toLocaleString("es-MX")} kcal
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Macros */}
        <Text style={[styles.eyebrow, { color: accent }]}>Totales del día</Text>
        <View style={styles.macrosCard}>
          <View style={styles.macroCell}>
            <Text style={styles.macroLabel}>Energía</Text>
            <Text style={styles.macroValue}>
              {macros.kcal}
              <Text style={styles.macroUnit}> kcal</Text>
            </Text>
          </View>
          <View style={styles.macroCell}>
            <Text style={styles.macroLabel}>Proteína</Text>
            <Text style={styles.macroValue}>
              {macros.protein}
              <Text style={styles.macroUnit}> g</Text>
            </Text>
          </View>
          <View style={styles.macroCell}>
            <Text style={styles.macroLabel}>Carbohidratos</Text>
            <Text style={styles.macroValue}>
              {macros.carbs}
              <Text style={styles.macroUnit}> g</Text>
            </Text>
          </View>
          <View style={styles.macroCellLast}>
            <Text style={styles.macroLabel}>Lípidos</Text>
            <Text style={styles.macroValue}>
              {macros.fat}
              <Text style={styles.macroUnit}> g</Text>
            </Text>
          </View>
        </View>

        {/* Equivalentes distribution */}
        {hasEquivalentes && eqGroups && (
          <View wrap={false}>
            <Text style={[styles.eyebrow, { color: accent }]}>
              Distribución por equivalentes
            </Text>
            <View style={styles.eqTable}>
              <View style={[styles.eqHeaderRow, { backgroundColor: accent }]}>
                <Text style={[styles.eqHeaderCell, { flex: 3 }]}>Grupo</Text>
                <Text style={[styles.eqHeaderCell, { flex: 1, textAlign: "right" }]}>
                  Equiv.
                </Text>
                <Text style={[styles.eqHeaderCell, { flex: 1, textAlign: "right" }]}>
                  Kcal
                </Text>
              </View>
              {GRUPO_KEYS.filter((k) => (eqGroups[k] ?? 0) > 0).map((k) => {
                const g = EQUIVALENTES_GRUPOS[k];
                const n = eqGroups[k] ?? 0;
                return (
                  <View key={k} style={styles.eqRow}>
                    <Text style={styles.eqGroupCell}>{g.label.es}</Text>
                    <Text style={styles.eqNumCell}>{n} eq</Text>
                    <Text style={styles.eqNumCell}>{g.kcal * n} kcal</Text>
                  </View>
                );
              })}
              <View style={styles.eqTotalRow}>
                <Text style={styles.eqTotalLabel}>Total</Text>
                <Text style={styles.eqTotalNum} />
                <Text style={styles.eqTotalNum}>
                  {eqTotalKcal.toLocaleString("es-MX")} kcal
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Meals */}
        <Text style={[styles.eyebrow, { color: accent }]}>
          Distribución por comida
        </Text>

        {grouped.length === 0 ? (
          <Text style={[styles.muted, { marginTop: 14 }]}>
            Aún no se han agregado comidas a este plan.
          </Text>
        ) : (
          grouped.map((g) => {
            // Aggregate this meal's kcal
            const mealKcal = g.items.reduce((acc, it) => {
              const e = it.equivalent;
              return acc + (e?.kcal ?? 0) * (it.servings || 1);
            }, 0);
            return (
              <View key={g.name} style={styles.mealBlock} wrap={false}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{g.name}</Text>
                  <Text style={styles.muted}>{Math.round(mealKcal)} kcal</Text>
                </View>
                {g.items.map((it) => {
                  const e = it.equivalent;
                  const name =
                    e?.food_name_es ??
                    e?.food_name_en ??
                    e?.food_name ??
                    "Alimento";
                  const serving =
                    e?.serving_desc_es ??
                    e?.serving_desc_en ??
                    e?.serving_desc ??
                    "—";
                  const itemKcal = (e?.kcal ?? 0) * (it.servings || 1);
                  return (
                    <View key={it.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        {name}
                        {it.servings && it.servings !== 1
                          ? `  · ${it.servings}×`
                          : ""}
                      </Text>
                      <Text style={styles.itemServing}>{serving}</Text>
                      <Text style={styles.itemKcal}>
                        {Math.round(itemKcal)} kcal
                      </Text>
                    </View>
                  );
                })}
                {g.notes && (
                  <Text style={[styles.subtle, { marginTop: 4 }]}>
                    {g.notes}
                  </Text>
                )}
              </View>
            );
          })
        )}

        {plan.notes && (
          <View style={styles.notesBox}>
            <Text style={[styles.eyebrow, { color: accent }]}>
              Notas del plan
            </Text>
            <Text style={styles.body}>{plan.notes}</Text>
          </View>
        )}

        {/* Signature only lives on the last page when there is no reference page */}
        {!hasInter && <SignatureBlock />}

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>
            Generado con Anthroscope Plan Builder · planbuilder.anthroscope.pro
          </Text>
          <Text
            style={styles.pageNum}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ─── Intercambios reference ─── */}
      {hasInter && (
        <Page size="LETTER" style={styles.page}>
          <BrandHeader />

          <Text style={[styles.eyebrow, { color: accent }]}>Referencia</Text>
          <Text style={styles.h1}>Sistema de intercambios</Text>
          <Text style={[styles.muted, { marginBottom: 22 }]}>
            Cada grupo aporta los mismos macros por equivalente. Elige entre las
            opciones para mantener tu plan variado.
          </Text>

          {intercambios!.map((grp) => (
            <View key={grp.key} style={styles.interBlock} wrap={false}>
              <View style={styles.interHead}>
                <Text style={styles.interTitle}>{grp.label}</Text>
                <Text style={styles.muted}>{grp.equivalents} eq/día</Text>
              </View>
              <Text style={styles.interMacros}>
                1 equivalente = {grp.perEquiv.kcal} kcal · {grp.perEquiv.protein}g
                proteína · {grp.perEquiv.carbs}g carb · {grp.perEquiv.fat}g grasa
              </Text>
              {grp.foods.map((f, i) => (
                <View key={i} style={styles.interFoodRow}>
                  <Text style={styles.interFoodName}>{f.name}</Text>
                  <Text style={styles.interFoodServing}>{f.serving}</Text>
                </View>
              ))}
            </View>
          ))}

          <SignatureBlock />

          <View style={styles.footer} fixed>
            <Text style={styles.footerBrand}>
              Generado con Anthroscope Plan Builder · planbuilder.anthroscope.pro
            </Text>
            <Text
              style={styles.pageNum}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </Page>
      )}
    </Document>
  );
};

export default PlanPdf;
