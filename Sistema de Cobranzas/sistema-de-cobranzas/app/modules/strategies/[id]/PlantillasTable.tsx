"use client";

export default function PlantillasTable({ plantillas }: { plantillas: any[] }) {
  return (
    <div className="text-xs overflow-x-auto max-h-64 overflow-y-auto">
      {plantillas.length > 0 ? (
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-slate-100">
              <th className="border px-2 py-1 text-left font-semibold">Nombre</th>
              <th className="border px-2 py-1 text-left font-semibold">Canal</th>
              <th className="border px-2 py-1 text-left font-semibold">Descripción</th>
              <th className="border px-2 py-1 text-center font-semibold">Contenido</th>
            </tr>
          </thead>
          <tbody>
            {plantillas.map((p, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50">
                <td className="border px-2 py-1">{p.nombre ?? "-"}</td>
                <td className="border px-2 py-1">{p.canal ?? "-"}</td>
                <td className="border px-2 py-1 text-xs">{p.descripcion ?? "-"}</td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => {
                      const modal = document.getElementById(`modal-plantilla-${i}`) as HTMLDialogElement;
                      modal?.showModal();
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                  >
                    Ver
                  </button>
                  <dialog id={`modal-plantilla-${i}`} className="rounded-lg p-6 backdrop:bg-black/50 max-w-2xl">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">{p.nombre ?? "Plantilla"}</h3>
                      <div className="text-sm text-slate-600">
                        <strong>Canal:</strong> {p.canal ?? "-"}
                      </div>
                      <div className="text-sm text-slate-600">
                        <strong>Descripción:</strong> {p.descripcion ?? "-"}
                      </div>
                      <div className="border-t pt-4">
                        <strong className="text-sm">Contenido:</strong>
                        <div className="mt-2 p-3 bg-slate-50 rounded text-sm whitespace-pre-wrap">
                          {p.contenido ?? "Sin contenido"}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            const modal = document.getElementById(`modal-plantilla-${i}`) as HTMLDialogElement;
                            modal?.close();
                          }}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center text-slate-400">Sin configurar</div>
      )}
    </div>
  );
}
