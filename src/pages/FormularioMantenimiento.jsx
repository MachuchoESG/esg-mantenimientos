import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import HistorialServicios from "./HistorialServicios";

export default function FormularioMantenimiento() {

  const navigate = useNavigate();

  const [vistaActual, setVistaActual] = useState("formulario");

  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [area, setArea] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [usuario, setUsuario] = useState("");

  // Datos equipo
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [noSerie, setNoSerie] = useState("");
  const [cpu, setCpu] = useState("");
  const [ram, setRam] = useState("");
  const [disco, setDisco] = useState("");
  const [so, setSo] = useState("");
  const [ipEquipo, setIpEquipo] = useState("");

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Cargar empresas y usuarios
  useEffect(() => {
    const cargarDatos = async () => {

      // Empresas
      const queryEmpresas = await getDocs(collection(db, "empresas"));
      const listaEmpresas = queryEmpresas.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpresas(listaEmpresas);

      // Usuarios (técnicos)
      const queryUsuarios = await getDocs(collection(db, "usuarios"));
      const listaUsuarios = queryUsuarios.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(listaUsuarios);
    };

    cargarDatos();
  }, []);

  // Guardar mantenimiento con folio incremental
  const guardarConfirmado = async () => {
    try {
      setCargando(true);
      setMensaje("");

      const snapshot = await getDocs(collection(db, "mantenimientos"));
      const total = snapshot.size + 1;

      const nuevoFolio = `F-${String(total).padStart(3, "0")}`;

      await addDoc(collection(db, "mantenimientos"), {
        folio: nuevoFolio,
        empresaId: empresaSeleccionada,
        area,
        ubicacion,
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
        creadoPor: auth.currentUser?.uid || "desconocido",
        createdAt: serverTimestamp()
      });

      setMensaje(`Mantenimiento guardado correctamente. Folio: ${nuevoFolio}`);

      // Reset
      setEmpresaSeleccionada("");
      setArea("");
      setUbicacion("");
      setResponsable("");
      setFecha("");
      setTecnico("");
      setUsuario("");
      setMarca("");
      setModelo("");
      setNoSerie("");
      setCpu("");
      setRam("");
      setDisco("");
      setSo("");
      setIpEquipo("");
      setChecklist(checklistInicial);
      setConfirmando(false);

    } catch (error) {
      console.error(error);
      setMensaje("Error al guardar");
    }

    setCargando(false);
  };

  const handleGuardar = () => {
    if (!empresaSeleccionada || !area || !ubicacion || !responsable || !fecha || !tecnico) {
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
            onChange={(e) => setEmpresaSeleccionada(e.target.value)}
          >
            <option value="">Seleccionar Empresa</option>
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.id} - {emp.empresas}
              </option>
            ))}
          </select>

          <input placeholder="Área" value={area} onChange={(e)=>setArea(e.target.value)} />
          <input placeholder="Ubicación" value={ubicacion} onChange={(e)=>setUbicacion(e.target.value)} />
          <input placeholder="Responsable" value={responsable} onChange={(e)=>setResponsable(e.target.value)} />
          <input type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} />

        </div>

        <h3>Datos del Equipo</h3>

        <div className="grid-2">
          <input placeholder="Marca" value={marca} onChange={(e)=>setMarca(e.target.value)} />
          <input placeholder="Modelo" value={modelo} onChange={(e)=>setModelo(e.target.value)} />
          <input placeholder="No. Serie" value={noSerie} onChange={(e)=>setNoSerie(e.target.value)} />
          <input placeholder="CPU / Procesador" value={cpu} onChange={(e)=>setCpu(e.target.value)} />
          <input placeholder="RAM (GB)" value={ram} onChange={(e)=>setRam(e.target.value)} />
          <input placeholder="Disco" value={disco} onChange={(e)=>setDisco(e.target.value)} />
          <input placeholder="Sistema Operativo" value={so} onChange={(e)=>setSo(e.target.value)} />
          <input placeholder="IP / Nombre Equipo" value={ipEquipo} onChange={(e)=>setIpEquipo(e.target.value)} />
        </div>

        <h3>Checklist</h3>

        {checklist.map((item, index) => (
          <div key={index} className="checklist-row">
            <span>{item.actividad}</span>

            <input
              type="checkbox"
              checked={item.ok}
              onChange={(e)=>{
                const nuevo = [...checklist];
                nuevo[index].ok = e.target.checked;
                setChecklist(nuevo);
              }}
            />

            <input
              placeholder="Observaciones"
              value={item.observaciones}
              onChange={(e)=>{
                const nuevo = [...checklist];
                nuevo[index].observaciones = e.target.value;
                setChecklist(nuevo);
              }}
            />
          </div>
        ))}

        <div className="grid-2">

          {/*  SELECT DE TÉCNICOS */}
          <select
            value={tecnico}
            onChange={(e)=>setTecnico(e.target.value)}
          >
            <option value="">Seleccionar Técnico</option>
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
            <p>¿Confirmar que el servicio fue realizado por <strong>{tecnico}</strong>?</p>
            <button onClick={guardarConfirmado} disabled={cargando}>
              {cargando ? "Guardando..." : "Sí, confirmar"}
            </button>
            <button onClick={()=>setConfirmando(false)}>
              Cancelar
            </button>
          </div>
        )}

        {mensaje && <p className="mensaje">{mensaje}</p>}

      </div>
    </div>
  );
}