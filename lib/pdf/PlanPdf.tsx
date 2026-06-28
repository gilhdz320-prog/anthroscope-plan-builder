import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type React from "react";

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

export const PlanPdf: React.FC<{ data: PlanPdfData }> = ({ data }) => {
  const { plan, patient, meals, practitioner } = data;
  const macros = aggregateMacros(meals);
  const grouped = groupMeals(meals);
  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : "Paciente";

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
        <View style={styles.pageHeader} fixed>
          <Text style={styles.pageBrand}>Anthroscope</Text>
          <Text style={styles.pageHeaderRight}>{patientName}</Text>
        </View>

        <Text style={styles.eyebrow}>Resumen</Text>
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
          </View>
        )}

        {/* Macros */}
        <Text style={styles.eyebrow}>Totales del día</Text>
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

        {/* Meals */}
        <Text style={styles.eyebrow}>Distribución por comida</Text>

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
            <Text style={styles.eyebrow}>Notas del plan</Text>
            <Text style={styles.body}>{plan.notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>
            Powered by Anthroscope · planbuilder.anthroscope.pro
          </Text>
          <Text
            style={styles.pageNum}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default PlanPdf;
