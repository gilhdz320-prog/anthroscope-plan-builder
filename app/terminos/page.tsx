import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Términos de servicio · Anthroscope Plan Builder",
};

const RESPONSABLE = "[RAZÓN SOCIAL O NOMBRE DEL RESPONSABLE]";
const CORREO = "hola@anthroscope.pro";

export default function TerminosPage() {
  return (
    <LegalLayout
      eyebrow="Términos de servicio"
      title="Términos de servicio"
      updatedAt="octubre de 2026"
      intro={
        <p>
          Estos términos regulan el uso de <strong>Anthroscope Plan Builder</strong>{" "}
          (el «Servicio»), operado por {RESPONSABLE}. Al crear una cuenta aceptas
          estas condiciones.
        </p>
      }
      sections={[
        {
          title: "Qué es el Servicio",
          body: (
            <p>
              Una herramienta para profesionales de la nutrición: gestión de
              pacientes, construcción de planes alimentarios con equivalentes
              (SMAE), generación de PDF y portal para el paciente.{" "}
              <strong>No es un servicio médico</strong> ni sustituye el juicio
              clínico: el diagnóstico, la prescripción y el seguimiento son
              responsabilidad del profesional que lo usa.
            </p>
          ),
        },
        {
          title: "Tu cuenta",
          body: (
            <p>
              Debes ser mayor de edad y profesional de la nutrición (o estudiante
              en práctica supervisada). Eres responsable de mantener la
              confidencialidad de tu contraseña y de toda actividad realizada con
              tu cuenta. Notifícanos de inmediato cualquier acceso no autorizado.
            </p>
          ),
        },
        {
          title: "Datos de tus pacientes",
          body: (
            <>
              <p>
                <strong>Los datos son tuyos, no nuestros.</strong> Tú eres el
                responsable del tratamiento frente a tus pacientes; nosotros
                actuamos como encargado y solo los usamos para prestarte el
                Servicio.
              </p>
              <p>
                Es tu obligación contar con el consentimiento de cada paciente para
                registrar datos de salud y entregarle su plan por los canales que
                elijas. Puedes exportar tus datos (CSV) o solicitar su eliminación
                en cualquier momento.
              </p>
            </>
          ),
        },
        {
          title: "Planes, precios y pagos",
          body: (
            <>
              <p>
                El Servicio se cobra por suscripción en pesos mexicanos:{" "}
                <strong>$199 MXN al mes</strong> o <strong>$1,990 MXN al año</strong>
                , con impuestos incluidos cuando aplique. Las primeras cuentas
                pueden recibir una prueba de 14 días.
              </p>
              <p>
                El cobro se realiza con Stripe y se renueva automáticamente hasta
                que canceles. Los precios pueden cambiar; te avisaremos con al
                menos 30 días de anticipación y el cambio aplica en tu siguiente
                renovación.
              </p>
              <p>
                Si un pago falla, mantendrás acceso durante un periodo de gracia de
                5 días mientras actualizas tu método de pago.
              </p>
            </>
          ),
        },
        {
          title: "Cancelación y reembolsos",
          body: (
            <>
              <p>
                Puedes cancelar cuando quieras desde el portal de facturación. La
                cancelación detiene las renovaciones: conservas el acceso hasta el
                final del periodo ya pagado.
              </p>
              <p>
                Si es tu primera compra y no estás conforme, escríbenos dentro de
                los primeros 7 días para evaluar un reembolso. No se reembolsan
                periodos ya consumidos ni renovaciones no canceladas a tiempo.
              </p>
            </>
          ),
        },
        {
          title: "Uso aceptable",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>No subir datos de personas sin su consentimiento.</li>
              <li>No intentar acceder a cuentas o datos de otras personas.</li>
              <li>No revender, sublicenciar ni copiar el Servicio.</li>
              <li>No usar el Servicio para fines ilícitos o publicidad engañosa.</li>
            </ul>
          ),
        },
        {
          title: "Propiedad intelectual",
          body: (
            <p>
              El software, la marca y el diseño son de {RESPONSABLE}. Te otorgamos
              una licencia de uso personal, no exclusiva e intransferible mientras
              tu suscripción esté vigente. Los planes que tú creas y los datos de
              tus pacientes son tuyos.
            </p>
          ),
        },
        {
          title: "Disponibilidad",
          body: (
            <p>
              Buscamos que el Servicio esté disponible de forma continua, pero no
              garantizamos ausencia total de interrupciones. Puede haber
              mantenimientos programados o caídas de proveedores (Supabase, Vercel,
              Stripe). Recomendamos exportar tus datos periódicamente.
            </p>
          ),
        },
        {
          title: "Limitación de responsabilidad",
          body: (
            <p>
              En la medida permitida por la ley, no somos responsables de daños
              indirectos, lucro cesante ni de decisiones clínicas tomadas con base
              en el uso del Servicio. Nuestra responsabilidad total se limita al
              monto pagado por ti en los últimos 12 meses.
            </p>
          ),
        },
        {
          title: "Terminación",
          body: (
            <p>
              Podemos suspender o cancelar cuentas que incumplan estos términos o
              que pongan en riesgo a otras personas usuarias o la seguridad del
              Servicio, avisando por correo cuando sea posible. Tú puedes cancelar
              en cualquier momento.
            </p>
          ),
        },
        {
          title: "Ley aplicable y contacto",
          body: (
            <p>
              Estos términos se rigen por las leyes de los Estados Unidos
              Mexicanos. Para cualquier duda, escríbenos a{" "}
              <a href={`mailto:${CORREO}`} className="underline underline-offset-2">
                {CORREO}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
