import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Aviso de privacidad · Anthroscope Plan Builder",
};

/**
 * NOTA PARA EL RESPONSABLE (no visible al público):
 * Los campos marcados con «[…]» deben completarse con los datos legales reales
 * antes de publicar. Ver docs/LEGAL-REVISION.md.
 */
const RESPONSABLE = "[RAZÓN SOCIAL O NOMBRE DEL RESPONSABLE]";
const DOMICILIO = "[DOMICILIO FISCAL, CIUDAD, ESTADO, MÉXICO]";
const CORREO = "privacidad@anthroscope.pro";

export default function PrivacidadPage() {
  return (
    <LegalLayout
      eyebrow="Aviso de privacidad"
      title="Aviso de privacidad"
      updatedAt="octubre de 2026"
      intro={
        <>
          <p>
            Este aviso explica qué datos personales tratamos en{" "}
            <strong>Anthroscope Plan Builder</strong>, con qué finalidades y cómo
            puedes ejercer tus derechos. Se emite conforme a la Ley Federal de
            Protección de Datos Personales en Posesión de los Particulares
            (LFPDPPP).
          </p>
          <p>
            Si eres <strong>nutrióloga o nutriólogo</strong> usuaria del sistema,
            el responsable de los datos de tus pacientes <strong>eres tú</strong>.
            Nosotros actuamos como <strong>encargado</strong> que trata esos datos
            por cuenta tuya y solo para prestarte el servicio.
          </p>
        </>
      }
      sections={[
        {
          title: "Responsable del tratamiento",
          body: (
            <>
              <p>
                {RESPONSABLE}, con domicilio en {DOMICILIO}, es responsable de los
                datos de las personas usuarias del sistema (cuenta, contacto y
                facturación).
              </p>
              <p>
                Correo de contacto para privacidad:{" "}
                <a href={`mailto:${CORREO}`} className="underline underline-offset-2">
                  {CORREO}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          title: "Datos personales que tratamos",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>De la persona usuaria:</strong> nombre, correo electrónico,
                contraseña (cifrada), datos de facturación y registros de uso del
                panel.
              </li>
              <li>
                <strong>De tus pacientes</strong> (que tú capturas): nombre, datos
                de contacto, datos antropométricos, antecedentes, planes
                alimentarios y cualquier información clínica que decidas
                registrar.
              </li>
              <li>
                <strong>Datos de salud:</strong> son datos personales sensibles.
                Solo se tratan con el consentimiento que tú obtienes de tu
                paciente en consulta.
              </li>
            </ul>
          ),
        },
        {
          title: "Finalidades del tratamiento",
          body: (
            <>
              <p>
                <strong>Primarias</strong> (necesarias para el servicio): crear y
                administrar tu cuenta, almacenar pacientes y planes, generar PDF y
                enlaces de portal, procesar pagos, enviar correos operativos
                (confirmaciones, avisos de cobro, cambios de servicio) y darte
                soporte.
              </p>
              <p>
                <strong>Secundarias</strong> (puedes oponerte): enviarte
                comunicaciones sobre mejoras del producto. No vendemos ni
                compartimos tus datos con fines publicitarios.
              </p>
            </>
          ),
        },
        {
          title: "Transferencias y encargados",
          body: (
            <>
              <p>
                Para operar el servicio usamos proveedores que tratan datos por
                nuestra cuenta y bajo contrato:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Supabase</strong> — base de datos y autenticación
                  (alojamiento fuera de México).
                </li>
                <li>
                  <strong>Vercel</strong> — alojamiento de la aplicación.
                </li>
                <li>
                  <strong>Stripe</strong> — procesamiento de pagos. No almacenamos
                  números de tarjeta.
                </li>
                <li>
                  <strong>Resend</strong> — envío de correos transaccionales.
                </li>
              </ul>
              <p>
                Estas transferencias implican un cambio de jurisdicción. Al usar el
                servicio, aceptas dichas transferencias; puedes solicitar
                información adicional en {CORREO}.
              </p>
            </>
          ),
        },
        {
          title: "Derechos ARCO y cómo ejercerlos",
          body: (
            <>
              <p>
                Tienes derecho a <strong>Acceder</strong> a tus datos,{" "}
                <strong>Rectificarlos</strong>, <strong>Cancelarlos</strong> u{" "}
                <strong>Oponerte</strong> a su tratamiento, así como a revocar el
                consentimiento y a la portabilidad.
              </p>
              <p>
                Escríbenos a{" "}
                <a href={`mailto:${CORREO}`} className="underline underline-offset-2">
                  {CORREO}
                </a>{" "}
                indicando tu nombre, el derecho que ejerces y el correo de tu
                cuenta. Responderemos en un plazo máximo de 20 días hábiles.
              </p>
              <p>
                Si eres paciente de una nutrióloga usuaria, dirígete primero a
                ella: es la responsable de tu expediente. Nosotros le facilitamos
                las herramientas para atenderte (exportar o borrar tus datos).
              </p>
            </>
          ),
        },
        {
          title: "Conservación de los datos",
          body: (
            <p>
              Conservamos los datos mientras tu cuenta esté activa. Si cancelas,
              permanecen <strong>90 días</strong> para que puedas reactivar sin
              perder nada; después se eliminan de forma definitiva, salvo lo que
              la ley obligue a conservar (por ejemplo, comprobantes fiscales).
            </p>
          ),
        },
        {
          title: "Medidas de seguridad",
          body: (
            <p>
              Usamos cifrado en tránsito (HTTPS), cifrado en reposo del proveedor
              de base de datos, aislamiento por fila (RLS) para que cada
              profesional solo vea sus propios pacientes, y acceso restringido a
              producción. Ningún sistema es infalible: si ocurriera una
              vulnerabilidad que afecte tus datos, notificaremos a las personas
              afectadas conforme a la ley.
            </p>
          ),
        },
        {
          title: "Cookies y tecnologías similares",
          body: (
            <p>
              Solo usamos cookies necesarias para mantener tu sesión iniciada. No
              usamos cookies publicitarias de terceros ni vendemos perfiles.
            </p>
          ),
        },
        {
          title: "Cambios a este aviso",
          body: (
            <p>
              Si modificamos este aviso, publicaremos la nueva versión en esta
              página y te avisaremos por correo cuando el cambio sea sustancial.
              La fecha de actualización aparece al inicio.
            </p>
          ),
        },
      ]}
    />
  );
}
