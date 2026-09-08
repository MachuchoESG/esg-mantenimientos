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
import logo from "../images/logo-pdf.png";

export default function HistorialServicios({ regresar }) {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");

  const [mantenimientos, setMantenimientos] = useState([]);

  const [paginaActual, setPaginaActual] = useState(1);

  const registrosPorPagina = 5;

  const [filtroFolio, setFiltroFolio] = useState("");
  const [filtroResponsable, setFiltroResponsable] = useState("");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  /*CARGAR EMPRESAS */

  useEffect(() => {

    const cargarEmpresas = async () => {

      const snapshot = await getDocs(collection(db, "empresas"));

      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEmpresas(lista);

    };

    cargarEmpresas();

  }, []);

  /*CARGAR MANTENIMIENTOS */

  const cargarMantenimientos = async () => {

    if (!empresaSeleccionada) return;

    const q = query(
      collection(db, "mantenimientos"),
      where("empresaId", "==", empresaSeleccionada)
    );

    const snapshot = await getDocs(q);

    const nuevos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setMantenimientos(nuevos);

    setPaginaActual(1);

  };
  useEffect(() => {

    setMantenimientos([]);
    setPaginaActual(1);

    if (empresaSeleccionada) {
      cargarMantenimientos();
    }

  }, [empresaSeleccionada]);

  /*FILTROS*/

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

  const totalPaginas = Math.ceil(
    listaFiltrada.length / registrosPorPagina
  );

  const indiceInicio =
    (paginaActual - 1) * registrosPorPagina;

  const registrosPagina = listaFiltrada.slice(
    indiceInicio,
    indiceInicio + registrosPorPagina
  );

  useEffect(() => {

    setPaginaActual(1);

  }, [
    filtroFolio,
    filtroResponsable,
    fechaInicio,
    fechaFin
  ]);

  /* PDF  */

  const exportarPDFServicio = () => {

    const pdf = new jsPDF();

    pdf.addImage(logo, "PNG", 10, 8, 40, 20);

    pdf.setFontSize(16);
    pdf.text("Reporte de Mantenimiento Preventivo", 60, 20);

    pdf.setFontSize(12);

    let y = 40;

    const linea = (texto) => {

      if (y > 270) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(texto, 10, y);
      y += 8;

    };

    linea(`Folio: ${detalleSeleccionado.folio}`);
    linea(`Fecha: ${detalleSeleccionado.fecha}`);
    linea(`Departamento: ${detalleSeleccionado.departamentoNombre}`);
    linea(`Responsable: ${detalleSeleccionado.responsable}`);
    linea(`Técnico: ${detalleSeleccionado.tecnico}`);

    y += 5;
    linea("Equipo:");

    linea(`Marca: ${detalleSeleccionado.equipo?.marca}`);
    linea(`Modelo: ${detalleSeleccionado.equipo?.modelo}`);
    linea(`Serie: ${detalleSeleccionado.equipo?.noSerie}`);

    y += 5;
    linea("Checklist:");

    detalleSeleccionado.checklist?.forEach((item) => {
      linea(`${item.actividad}: ${item.ok ? "OK" : "NO"}`);
    });

    if (detalleSeleccionado.firmaTecnico) {

      pdf.addPage();

      pdf.text("Firma del Técnico", 10, 20);

      pdf.addImage(detalleSeleccionado.firmaTecnico, "PNG", 10, 30, 80, 40);

    }

    pdf.save(`Servicio_${detalleSeleccionado.folio}.pdf`);

  };

 /* ===============================
    PDF HISTORIAL
=============================== */

const exportarPDFHistorial = async () => {

  const input = document.getElementById("tabla-pdf");

  // OBTENER NOMBRE REAL DE EMPRESA
  const empresaObj = empresas.find(
    emp =>
      emp.id === empresaSeleccionada ||
      emp.empresaId === empresaSeleccionada
  );

  const empresaNombre =
    empresaObj?.empresas ||
    empresaSeleccionada ||
    "General";

  const canvas = await html2canvas(input, {
    scale: 2
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  // =========================
  // LOGO
  // =========================

  pdf.addImage(logo, "PNG", 10, 8, 40, 20);


  // TITULO
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");

  pdf.text(
    "Historial de Servicios",
    105,
    18,
    { align: "center" }
  );

  // =========================
  // EMPRESA
  // =========================

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");

  pdf.text(
    `Empresa: ${empresaNombre}`,
    105,
    26,
    { align: "center" }
  );

  // =========================
  // FECHA
  // =========================

  const fechaActual = new Date().toLocaleDateString();

  pdf.setFontSize(10);

  pdf.text(
    `Generado: ${fechaActual}`,
    105,
    32,
    { align: "center" }
  );

  // =========================
  // TABLA
  // =========================

  const pdfWidth = 190;

  const pdfHeight =
    (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(
    imgData,
    "PNG",
    10,
    40,
    pdfWidth,
    pdfHeight
  );

  // =========================
  // GUARDAR PDF
  // =========================

  pdf.save(`Historial_${empresaNombre}.pdf`);

};

  return (

    <div className="form-container">

      <div className="form-box">

        <h2>Historial de Servicios</h2>

        <select
          className="select-empresa"
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

          <div className="filtros-fechas">
            <div>
              <label>Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e)=>setFechaInicio(e.target.value)}
              />
            </div>

            <div>
              <label>Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e)=>setFechaFin(e.target.value)}
              />
            </div>

          </div>
        </div>

          <button
            className="btn-primario"
            style={{marginBottom:"20px"}}
            onClick={exportarPDFHistorial}
          >
            Exportar Historial PDF
          </button>

          {/* TABLA DESKTOP */}

          <table className="tabla-historial desktop-table">

            <thead>
              <tr>
                <th>Folio</th>
                <th>Título</th>
                <th>Fecha</th>
                <th>Departamento</th>
                <th>Responsable</th>
                <th>Técnico</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {listaFiltrada.map(item => (

                <tr key={item.id}>

                  <td>{item.folio}</td>
                  <td>{item.titulo || "Sin título"}</td>
                  <td>{item.fecha}</td>
                  <td>{item.departamentoNombre}</td>
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

          {/* TARJETAS MOBILE */}

          <div className="mobile-cards">

            {registrosPagina.map(item => (

              <div key={item.id} className="historial-card">

                <div className="historial-titulo">
                  {item.titulo || "Sin título"}
                </div>

                <div><strong>Folio:</strong> {item.folio}</div>
                <div><strong>Fecha:</strong> {item.fecha}</div>
                <div><strong>Departamento:</strong> {item.departamentoNombre}</div>
                <div><strong>Responsable:</strong> {item.responsable}</div>
                <div><strong>Técnico:</strong> {item.tecnico}</div>

                <button
                  className="btn-ver"
                  onClick={()=>setDetalleSeleccionado(item)}
                >
                  Ver servicio
                </button>


              </div>

            ))}

          </div>

          {/* TABLA OCULTA PARA PDF */}

          <table id="tabla-pdf" style={{position:"absolute", left:"-9999px"}}>

            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Departamento</th>
                <th>Responsable</th>
                <th>Técnico</th>
              </tr>
            </thead>

            <tbody>

              {listaFiltrada.map(item => (

                <tr key={item.id}>

                  <td>{item.folio}</td>
                  <td>{item.fecha}</td>
                  <td>{item.departamentoNombre}</td>
                  <td>{item.responsable}</td>
                  <td>{item.tecnico}</td>

                </tr>

              ))}

            </tbody>

          </table>
          
        <div className="paginacion">

          <button
            className="pagina-flecha"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual(paginaActual - 1)}
          >
            ←
          </button>

          {Array.from(
            { length: totalPaginas },
            (_, i) => i + 1
          ).map(numero => (

            <button
              key={numero}
              className={
                numero === paginaActual
                  ? "pagina activa"
                  : "pagina"
              }
              onClick={() => setPaginaActual(numero)}
            >
              {numero}
            </button>

          ))}

          <button
            className="pagina-flecha"
            disabled={
              paginaActual === totalPaginas ||
              totalPaginas === 0
            }
            onClick={() => setPaginaActual(paginaActual + 1)}
          >
            →
          </button>

        </div>

          </>

        )}

        {/* MODAL DETALLE */}

        {detalleSeleccionado && (

          <div className="modal-overlay">

            <div className="modal-content">

              <h2>Servicio {detalleSeleccionado.folio}</h2>

              <p><strong>Fecha:</strong> {detalleSeleccionado.fecha}</p>
              <p><strong>Departamento:</strong> {detalleSeleccionado.departamentoNombre}</p>
              <p><strong>Area:</strong> {detalleSeleccionado.area}</p>
              <p><strong>Responsable:</strong> {detalleSeleccionado.responsable}</p>
              <p><strong>Técnico:</strong> {detalleSeleccionado.tecnico}</p>

              <h3>Equipo</h3>

              <p>
                {detalleSeleccionado.equipo?.marca} - {detalleSeleccionado.equipo?.modelo}
              </p>

              <h3>Checklist</h3>

              {detalleSeleccionado.checklist?.map((c,i)=>(
                <div key={i}>
                  {c.actividad} → {c.ok ? "✔" : "❌"}
                </div>
              ))}

              <div className="modal-botones">

                <button
                  className="btn-primario"
                  onClick={exportarPDFServicio}
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