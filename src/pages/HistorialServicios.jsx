import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  startAfter
} from "firebase/firestore";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function HistorialServicios({ regresar }) {

  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");

  const [mantenimientos, setMantenimientos] = useState([]);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [hayMas, setHayMas] = useState(true);

  const [filtroFolio, setFiltroFolio] = useState("");
  const [filtroResponsable, setFiltroResponsable] = useState("");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  /* ===============================
      CARGAR EMPRESAS
  =============================== */
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {

        const snapshot = await getDocs(collection(db, "empresas"));

        const lista = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setEmpresas(lista);

      } catch (error) {
        console.error("Error cargando empresas:", error);
      }
    };

    cargarEmpresas();
  }, []);

  /* ===============================
      CARGAR MANTENIMIENTOS
  =============================== */
  const cargarMantenimientos = async (cargarMas = false) => {

    if (!empresaSeleccionada) return;

    try {

      let q;

      if (cargarMas && ultimoDoc) {

        q = query(
          collection(db, "mantenimientos"),
          where("empresaId", "==", empresaSeleccionada),
          startAfter(ultimoDoc),
          limit(5)
        );

      } else {

        q = query(
          collection(db, "mantenimientos"),
          where("empresaId", "==", empresaSeleccionada),
          limit(5)
        );

      }

      const snapshot = await getDocs(q);

      const nuevos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ordenar por fecha descendente
      nuevos.sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return b.fecha.localeCompare(a.fecha);
      });

      if (snapshot.docs.length < 5) {
        setHayMas(false);
      } else {
        setHayMas(true);
      }

      setUltimoDoc(snapshot.docs[snapshot.docs.length - 1]);

      if (cargarMas) {
        setMantenimientos(prev => [...prev, ...nuevos]);
      } else {
        setMantenimientos(nuevos);
      }

    } catch (error) {
      console.error("Error cargando mantenimientos:", error);
    }
  };

  useEffect(() => {

    setMantenimientos([]);
    setUltimoDoc(null);
    setHayMas(true);

    if (empresaSeleccionada) {
      cargarMantenimientos();
    }

  }, [empresaSeleccionada]);

  /* ===============================
      FILTROS
  =============================== */

  const listaFiltrada = mantenimientos.filter(item => {

    const f1 = filtroFolio
      ? item.folio?.toLowerCase().includes(filtroFolio.toLowerCase())
      : true;

    const f2 =
      fechaInicio && fechaFin
        ? item.fecha >= fechaInicio && item.fecha <= fechaFin
        : true;

    const f3 = filtroResponsable
      ? item.responsable?.toLowerCase().includes(filtroResponsable.toLowerCase())
      : true;

    return f1 && f2 && f3;

  });

  /* ===============================
      EXPORTAR PDF
  =============================== */

  const exportarPDF = async () => {

    const input = document.getElementById("detalle-pdf");

    const canvas = await html2canvas(input);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();

    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);

    pdf.save(`Servicio_${detalleSeleccionado.folio}.pdf`);

  };

  return (

    <div className="form-container">
      <div className="form-box">

        <h2>Historial de Servicios</h2>

        {/* SELECT EMPRESA */}
        <select
          value={empresaSeleccionada}
          onChange={(e)=>setEmpresaSeleccionada(e.target.value)}
        >

          <option value="">Seleccionar Empresa</option>

          {empresas.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.empresas}
            </option>
          ))}

        </select>

        {empresaSeleccionada && (

          <>
          
          {/* FILTROS */}

          <div className="grid-4 filtros">

            <input
              placeholder="Buscar Folio"
              value={filtroFolio}
              onChange={(e)=>setFiltroFolio(e.target.value)}
            />

            <input
              placeholder="Responsable"
              value={filtroResponsable}
              onChange={(e)=>setFiltroResponsable(e.target.value)}
            />

            <input
              type="date"
              value={fechaInicio}
              onChange={(e)=>setFechaInicio(e.target.value)}
            />

            <input
              type="date"
              value={fechaFin}
              onChange={(e)=>setFechaFin(e.target.value)}
            />

          </div>


          {/* TABLA */}

          <table className="tabla-historial">

            <thead>

              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Área</th>
                <th>Responsable</th>
                <th>Técnico</th>
                <th>Acciones</th>
              </tr>

            </thead>

            <tbody>

              {listaFiltrada.map(item => (

                <tr key={item.id}>

                  <td>{item.folio}</td>
                  <td>{item.fecha}</td>
                  <td>{item.area}</td>
                  <td>{item.responsable}</td>
                  <td>{item.tecnico}</td>

                  <td>

                    <button
                      className="btn-ver"
                      onClick={()=>setDetalleSeleccionado(item)}
                    >
                      Ver
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>


          {hayMas && (

            <button
              className="btn-secundario"
              onClick={()=>cargarMantenimientos(true)}
            >
              Cargar más
            </button>

          )}

          {listaFiltrada.length === 0 && (

            <p style={{marginTop:20}}>
              No hay registros para esta empresa
            </p>

          )}

          </>
        )}


        {/* MODAL DETALLE */}

        {detalleSeleccionado && (

          <div className="modal-overlay">

            <div className="modal-content" id="detalle-pdf">

              <h2>Servicio {detalleSeleccionado.folio}</h2>

              <p><strong>Fecha:</strong> {detalleSeleccionado.fecha}</p>
              <p><strong>Área:</strong> {detalleSeleccionado.area}</p>
              <p><strong>Ubicación:</strong> {detalleSeleccionado.ubicacion}</p>
              <p><strong>Responsable:</strong> {detalleSeleccionado.responsable}</p>
              <p><strong>Técnico:</strong> {detalleSeleccionado.tecnico}</p>

              <h3>Equipo</h3>

              <p>
                {detalleSeleccionado.equipo?.marca} - {detalleSeleccionado.equipo?.modelo}
              </p>

              <p>Serie: {detalleSeleccionado.equipo?.noSerie}</p>
              <p>CPU: {detalleSeleccionado.equipo?.cpu}</p>
              <p>RAM: {detalleSeleccionado.equipo?.ram}</p>
              <p>Disco: {detalleSeleccionado.equipo?.disco}</p>
              <p>Sistema: {detalleSeleccionado.equipo?.sistemaOperativo}</p>

              <h3>Checklist</h3>

              {detalleSeleccionado.checklist?.map((c,i)=>(
                <div key={i}>
                  {c.actividad} → {c.ok ? "✔" : "❌"}
                </div>
              ))}

              <div className="modal-botones">

                <button
                  className="btn-primario"
                  onClick={exportarPDF}
                >
                  Exportar PDF
                </button>

                <button
                  className="btn-secundario"
                  onClick={()=>setDetalleSeleccionado(null)}
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>

        )}

      </div>
    </div>

  );
}