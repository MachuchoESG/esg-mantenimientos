import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "./firebase";
import { useNavigate } from "react-router-dom";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  writeBatch
} from "firebase/firestore";

import { hayInternet } from "../utils/network";
import { guardarOffline } from "../offlineService";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

import imageCompression from "browser-image-compression";

import HistorialServicios from "./HistorialServicios";

export default function FormularioMantenimiento() {

  const navigate = useNavigate();

  const [vistaActual, setVistaActual] = useState("formulario");
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState(""); 
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [usuario, setUsuario] = useState("");

  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [noSerie, setNoSerie] = useState("");
  const [cpu, setCpu] = useState("");
  const [ram, setRam] = useState("");
  const [disco, setDisco] = useState("");
  const [so, setSo] = useState("");
  const [ipEquipo, setIpEquipo] = useState("");

  const [fotos, setFotos] = useState([]);
  const [previewFotos, setPreviewFotos] = useState([]);

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const checklistInicial = [
    { actividad: "Limpieza externa", ok: false, observaciones: "" },
    { actividad: "Limpieza interna", ok: false, observaciones: "" },
    { actividad: "Revisión ventiladores", ok: false, observaciones: "" },
    { actividad: "Cambio pasta térmica", ok: false, observaciones: "" },
    { actividad: "Optimización sistema", ok: false, observaciones: "" },
    { actividad: "Actualización antivirus", ok: false, observaciones: "" },
    { actividad: "Actualización Windows", ok: false, observaciones: "" },
    { actividad: "Prueba de hardware", ok: false, observaciones: "" },
    { actividad: "Respaldo de informacion", ok: false, observaciones: "" }
  ];

  const [checklist, setChecklist] = useState(checklistInicial);

  const opcionesCompresion = {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1280,
    useWebWorker: true
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  /* ================================
      CARGAR DATOS
  ================================ */

  useEffect(() => {

      const cargarDatos = async () => {
      const queryEmpresas = await getDocs(collection(db, "empresas"));
      setEmpresas(queryEmpresas.docs.map(doc => ({...doc.data() })));

      const queryUsuarios = await getDocs(collection(db, "usuarios"));
      setUsuarios(queryUsuarios.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const queryDepartamentos = await getDocs(collection(db, "departamentos"));
      setDepartamentos(queryDepartamentos.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    };

    cargarDatos();

  }, []);

  /* ================================
      MANEJAR FOTOS 
  ================================ */

  const manejarFotos = (files) => {

    const nuevos = Array.from(files);

    if (fotos.length + nuevos.length > 8) {
      alert("Máximo 8 fotos");
      return;
    }

    const nuevasFotos = [...fotos, ...nuevos];
    setFotos(nuevasFotos);

    const previews = nuevos.map(file => URL.createObjectURL(file));
    setPreviewFotos(prev => [...prev, ...previews]);
  };

  const eliminarFoto = (index) => {

    setFotos(fotos.filter((_, i) => i !== index));
    setPreviewFotos(previewFotos.filter((_, i) => i !== index));

  };

  /* ================================
      SUBIR FOTOS
  ================================ */

  const subirFotos = async (folio) => {

    const urls = [];

    for (let i = 0; i < fotos.length; i++) {

      try {

        const imagenComprimida = await imageCompression(fotos[i], opcionesCompresion);

        const storageRef = ref(
          storage,
          `mantenimientos/${folio}/foto_${i}_${Date.now()}.jpg`
        );

        await uploadBytes(storageRef, imagenComprimida);

        const url = await getDownloadURL(storageRef);

        urls.push(url);

      } catch (error) {
        console.error("Error subiendo imagen:", error);
      }

    }

    return urls;

  };

  /* ================================
      GUARDAR
  ================================ */

const ultimoFolio =
  parseInt(localStorage.getItem("ultimoFolio")) || 0;

const siguienteFolio = ultimoFolio + 1;

localStorage.setItem(
  "ultimoFolio",
  siguienteFolio
);

const nuevoFolio =
  `F-${String(siguienteFolio).padStart(3, "0")}`;

const guardarConfirmado = async () => {

  try {

    setCargando(true);
    setMensaje("");

    // FOLIO OFFLINE REAL
    const nuevoFolio = `F-${Date.now()}`;

    const departamentoSeleccionado = departamentos.find(
      d => d.departamentoNombre === departamento
    );

    // DATA
    const data = {

        folio: nuevoFolio,

        titulo,

        empresaId: empresaSeleccionada,

        departamentoId:
          departamentoSeleccionado?.departamentoId || "",

        departamentoNombre: departamento,

        area,
        responsable,
        fecha,
        tecnico,
        usuario,

        equipo: {
          marca,
          modelo,
          noSerie,
          cpu,
          ram,
          disco,
          sistemaOperativo: so,
          ipEquipo
        },

        checklist,

        fotos: [],

        estadoSync: 0,

        creadoPor:
          auth.currentUser?.uid || "desconocido",

        createdAt: new Date().toISOString()
    };

    // =========================
    // SIN INTERNET
    // =========================

    if (!hayInternet()) {

      await guardarOffline(data);

      setMensaje(
        `Sin internet. Guardado localmente. Folio: ${nuevoFolio}`
      );

      setConfirmando(false);
      setFotos([]);
      setPreviewFotos([]);
      setCargando(false);

      return;
    }

    // =========================
    // CON INTERNET
    // =========================

    try {

      const urlsFotos = await subirFotos(nuevoFolio);

      data.fotos = urlsFotos;

      await addDoc(
        collection(db, "mantenimientos"),
        {
          ...data,
          estadoSync: 1,
          createdAt: serverTimestamp()
        }
      );

      setMensaje(
        `Mantenimiento guardado. Folio: ${nuevoFolio}`
      );

    } catch (error) {

      console.error(error);

      // si falla internet a mitad
      await guardarOffline(data);

      setMensaje(
        `Error de red. Guardado offline. Folio: ${nuevoFolio}`
      );
    }

    setConfirmando(false);
    setFotos([]);
    setPreviewFotos([]);

  } catch (error) {

    console.error(error);

    setMensaje("Error al guardar");
  }

  setCargando(false);
};

  const handleGuardar = () => {

    if (
      !empresaSeleccionada ||
      !departamento ||
      !titulo ||
      !area ||
      !responsable ||
      !fecha ||
      !tecnico
    ) {
      setMensaje("Completa los campos obligatorios");
      return;
    }

    setConfirmando(true);

  };

  if (vistaActual === "historial") {

    return (
      <HistorialServicios
        regresar={() => setVistaActual("formulario")}
      />
    );

  }

  return (

    <div className="form-container">

      <div className="form-box">

        <div className="form-title">
          Mantenimiento Preventivo
        </div>

<div className="grid-2">
          
  <select
    value={empresaSeleccionada}
    onChange={(e)=>setEmpresaSeleccionada(e.target.value)}
  >
    <option value="">Empresa</option>

    {empresas.map((emp, index) => (
      <option
        key={index}
        value={emp.empresas}
      >
        {emp.empresas}
      </option>
    ))}
  </select>

  <select
    value={departamento}
    onChange={(e)=>setDepartamento(e.target.value)}
  >
    <option value="">Departamento</option>

    {departamentos.map(dep => (
      <option
        key={dep.departamentoId}
        value={dep.departamentoNombre}
      >
        {dep.departamentoNombre}
      </option>
    ))}
  </select>

</div>

<input
  className="titulo-mantenimiento"
  placeholder="Título del mantenimiento"
  value={titulo}
  onChange={(e)=>setTitulo(e.target.value)}
/>

  <div className="grid-2">

      <input
        placeholder="Área"
        value={area}
        onChange={(e)=>setArea(e.target.value)}
      />

      <input
        placeholder="Responsable"
        value={responsable}
        onChange={(e)=>setResponsable(e.target.value)}
      />

      <input
        type="date"
        value={fecha}
        onChange={(e)=>setFecha(e.target.value)}
      />

  </div>

        <h3>Datos del Equipo</h3>

        <div className="grid-2">
          <input placeholder="Marca" value={marca} onChange={(e)=>setMarca(e.target.value)} />
          <input placeholder="Modelo" value={modelo} onChange={(e)=>setModelo(e.target.value)} />
          <input placeholder="No. Serie" value={noSerie} onChange={(e)=>setNoSerie(e.target.value)} />
          <input placeholder="CPU" value={cpu} onChange={(e)=>setCpu(e.target.value)} />
          <input placeholder="RAM" value={ram} onChange={(e)=>setRam(e.target.value)} />
          <input placeholder="Disco" value={disco} onChange={(e)=>setDisco(e.target.value)} />
          <input placeholder="Sistema Operativo" value={so} onChange={(e)=>setSo(e.target.value)} />
          <input placeholder="IP / Nombre Equipo" value={ipEquipo} onChange={(e)=>setIpEquipo(e.target.value)} />
        </div>

        <h3>Checklist</h3>

        {checklist.map((item,index)=>(

          <div key={index} className="checklist-row">

            <span>{item.actividad}</span>

            <input
              type="checkbox"
              checked={item.ok}
              onChange={(e)=>{
                const nuevo=[...checklist];
                nuevo[index].ok=e.target.checked;
                setChecklist(nuevo);
              }}
            />

            <input
              placeholder="Observaciones"
              value={item.observaciones}
              onChange={(e)=>{
                const nuevo=[...checklist];
                nuevo[index].observaciones=e.target.value;
                setChecklist(nuevo);
              }}
            />

          </div>

        ))}

{/* FOTOS */}

<div
  className="foto-upload"
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  }}
>

  {/* CONTENEDOR BOTONES */}
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      alignItems: "center"
    }}
  >

    {/* BOTÓN GALERÍA */}
    <label className="btn-foto">
      Seleccionar fotografías

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => manejarFotos(e.target.files)}
      />
    </label>

    {/* BOTÓN CÁMARA */}
    <label className="btn-foto">
      Tomar foto

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => manejarFotos(e.target.files)}
      />
    </label>

  </div>

  {/* PREVIEWS */}
  {previewFotos.length > 0 && (

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px"
      }}
    >

      {previewFotos.map((foto, i) => (

        <div
          key={i}
          style={{
            position: "relative"
          }}
        >

          <img
            src={foto}
            alt="preview"
            style={{
              width: "90px",
              height: "90px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}
          />

          <button
            type="button"
            onClick={() => eliminarFoto(i)}
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ×
          </button>

        </div>

      ))}

    </div>

  )}

</div>

        <div className="grid-2">

          <select value={tecnico} onChange={(e)=>setTecnico(e.target.value)}>
            <option value="">Técnico</option>
            {usuarios.map(user => (
              <option key={user.id} value={user.nombre}>
                {user.nombre}
              </option>
            ))}
          </select>

          <input
            placeholder="Usuario del equipo"
            value={usuario}
            onChange={(e)=>setUsuario(e.target.value)}
          />

        </div>

        {!confirmando && (
          <button className="btn-guardar" onClick={handleGuardar}>
            Guardar
          </button>
        )}

        {confirmando && (

          <div className="confirm-box">

            <p>
              ¿Confirmar que el servicio fue realizado por <strong>{tecnico}</strong>?
            </p>
            
            <button onClick={guardarConfirmado} disabled={cargando}>
              {cargando ? "Guardando..." : "Sí, confirmar"}
            </button>

            <button onClick={()=>setConfirmando(false)}>
              Cancelar
            </button>

          </div>

        )}

        {mensaje && (
          <p className="mensaje">{mensaje}</p>
        )}

      </div>

    </div>

  );
}
