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

      const snapshot = await getDocs(collection(db, "empresas"));

      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEmpresas(lista);

    };

    cargarEmpresas();

  }, []);

  /* ===============================
      CARGAR MANTENIMIENTOS
  =============================== */

  const cargarMantenimientos = async (cargarMas = false) => {

    if (!empresaSeleccionada) return;

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

    nuevos.sort((a, b) => {
      if (!a.fecha || !b.fecha) return 0;
      return b.fecha.localeCompare(a.fecha);
    });

    setUltimoDoc(snapshot.docs[snapshot.docs.length - 1]);

    if (snapshot.docs.length < 5) {
      setHayMas(false);
    }

    if (cargarMas) {
      setMantenimientos(prev => [...prev, ...nuevos]);
    } else {
      setMantenimientos(nuevos);
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
      PDF SERVICIO PROFESIONAL
  =============================== */

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

    const canvas = await html2canvas(input, {
      scale: 2
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    // LOGO
    pdf.addImage(logo, "PNG", 10, 8, 40, 20);

    // TITULO
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Historial de Servicios", 105, 20, { align: "center" });

    // ancho de hoja
    const pdfWidth = 190;

    // altura proporcional
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // TABLA
    pdf.addImage(imgData, "PNG", 10, 35, pdfWidth, pdfHeight);

    pdf.save("Historial_Servicios.pdf");

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

            {listaFiltrada.map(item => (

              <div key={item.id} className="historial-card">

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

          {hayMas && (

            <button
              className="btn-secundario"
              onClick={()=>cargarMantenimientos(true)}
            >
              Cargar más
            </button>

          )}

          </>

        )}

        {/* MODAL DETALLE */}

        {detalleSeleccionado && (

          <div className="modal-overlay">

            <div className="modal-content">

              <h2>Servicio {detalleSeleccionado.folio}</h2>

              <p><strong>Fecha:</strong> {detalleSeleccionado.fecha}</p>
              <p><strong>Departamento:</strong> {detalleSeleccionado.departamentoNombre}</p>
              <p><strong>Ubicación:</strong> {detalleSeleccionado.ubicacion}</p>
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