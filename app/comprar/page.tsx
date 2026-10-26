import { redirect } from "next/navigation";

/**
 * La página antigua de compra ($57 pago único) se retira.
 * Todo el flujo comercial vive ahora en /suscripcion (suscripción con trial).
 */
export default function ComprarPage() {
  redirect("/suscripcion");
}
