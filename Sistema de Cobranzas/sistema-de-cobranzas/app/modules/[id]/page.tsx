import { notFound } from "next/navigation";

const modules: Record<
  string,
  { title: string; requirements: Array<{ code: string; name: string }> }
> = {
  security: {
    title: "Módulo de Seguridad",
    requirements: [
      { code: "R101", name: "Registro de usuarios" },
      { code: "R102", name: "Otorgamiento de permisos" },
      { code: "R103", name: "Recuperación de contraseña" },
      { code: "R104", name: "Autenticación Multifactor" },
    ],
  },
  scheduling: {
    title: "Módulo de Programación de Recursos",
    requirements: [
      { code: "R201", name: "Validación de la cartera de cliente" },
      { code: "R202", name: "Clasificación de los deudores" },
      { code: "R203", name: "Asignación Manual de Recurso Humano" },
      { code: "R204", name: "Cambio de estado por vencimiento" },
      { code: "R205", name: "Consultar la programación" },
      { code: "R206", name: "Consultar el historial de los clientes" },
    ],
  },
  operations: {
    title: "Módulo de Operaciones",
    requirements: [
      { code: "R301", name: "Identificación de cliente" },
      { code: "R302", name: "Envío de notificación de cobranza (mensaje)" },
      { code: "R303", name: "Registro de Interacción del Cliente" },
      { code: "R304", name: "Derivación a Protesto o Legal" },
    ],
  },
  strategies: {
    title: "Módulo de Estrategias",
    requirements: [
      { code: "R401", name: "Visualizar historial de estrategias" },
      { code: "R402", name: "Crear estrategia" },
      { code: "R403", name: "Configurar canales de estrategia" },
      { code: "R404", name: "Asociar plantillas a estrategia" },
      { code: "R405", name: "Definir incentivos en estrategia" },
      { code: "R406", name: "Configurar refinanciamiento" },
    ],
  },
  reports: {
    title: "Módulo de Metas y Reportes",
    requirements: [
      { code: "R501", name: "Configurar metas de recuperación" },
      { code: "R502", name: "Monitorear cumplimiento de metas" },
      { code: "R503", name: "Reporte de morosidad" },
      { code: "R504", name: "Productividad por asesor y equipo" },
      { code: "R505", name: "Efectividad de estrategias y canales" },
      { code: "R506", name: "Alertas por umbrales" },
    ],
  },
};

type Params = { params: { id: string } };

export default function ModulePage({ params }: Params) {
  const id = params.id;
  const mod = modules[id];

  if (!mod) return notFound();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{mod.title}</h1>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Requerimientos</h2>
        <ul className="space-y-2">
          {mod.requirements.map((r) => (
            <li
              key={r.code}
              className="flex items-center justify-between border rounded p-3"
            >
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.code}</div>
              </div>
              <div>
                <button className="px-3 py-1 rounded bg-slate-100 text-sm">
                  Ver
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Notas</h2>
        <p className="text-sm text-muted-foreground">
          Esta es una versión inicial. Navega por los módulos desde el panel
          izquierdo para ver los requerimientos básicos.
        </p>
      </section>
    </div>
  );
}
