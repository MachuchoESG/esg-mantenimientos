import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

import FormularioMantenimiento from "./FormularioMantenimiento";
import HistorialServicios from "./HistorialServicios";
import Resumen from "./Resumen";

import "./dashboard.css";

export default function Dashboard() {
  const [vista, setVista] = useState("resumen");
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      
      {/* NAVBAR */}
      <header className="dashboard-nav">
        
        <div className="nav-logo">
          <h2>ServiceManager</h2>
        </div>

        <nav className="nav-left">
          <button 
            className={vista === "resumen" ? "active" : ""}
            onClick={() => setVista("resumen")}
          >
            Dashboard
          </button>

          <button 
            className={vista === "historial" ? "active" : ""}
            onClick={() => setVista("historial")}
          >
            Historial
          </button>

          <button 
            className={vista === "formulario" ? "active" : ""}
            onClick={() => setVista("formulario")}
          >
            Nuevo Servicio
          </button>
        </nav>

        <div className="nav-right">
          <button className="logout-btn" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>

      </header>

      {/* CONTENIDO */}
      <main className="dashboard-content">
        {vista === "resumen" && <Resumen />}
        {vista === "historial" && <HistorialServicios />}
        {vista === "formulario" && <FormularioMantenimiento />}
      </main>

    </div>
  );
}