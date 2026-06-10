import { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth"; 
import { auth, db } from "./firebase"; 
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import FormularioMantenimiento from "./FormularioMantenimiento";
import HistorialServicios from "./HistorialServicios";
import Resumen from "./Resumen";
import AdminUsuarios from "./AdminUsuarios"; 
import logo from "../images/esg.png";

import "./dashboard.css";

export default function Dashboard() {
  const [vista, setVista] = useState("resumen");
  const [rol, setRol] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false); //
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setRol(data.rol || data.id_rol);
        }
      } catch (error) {
        console.error("Error obteniendo rol:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
    navigate("/");
  };

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    setMenuAbierto(false);
  };

  return (
    <div className="dashboard-container">
      
      <header className="dashboard-nav">
        
        <div className="nav-logo">
          <img src={logo} alt="ESG Logo" className="nav-logo-img" />
        </div>

        <button 
          className="menu-toggle"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          ☰
        </button>

        <div className={`nav-menu ${menuAbierto ? "open" : ""}`}>

          <nav className="nav-left">
            <button 
              className={vista === "resumen" ? "active" : ""}
              onClick={() => cambiarVista("resumen")}
            >
              Dashboard
            </button>

            <button 
              className={vista === "historial" ? "active" : ""}
              onClick={() => cambiarVista("historial")}
            >
              Historial
            </button>

            <button 
              className={vista === "formulario" ? "active" : ""}
              onClick={() => cambiarVista("formulario")}
            >
              Nuevo Servicio
            </button>

            {(rol === "admin" || rol === 2) && (
              <button 
                className={vista === "admin" ? "active" : ""}
                onClick={() => cambiarVista("admin")}
              >
                Panel Admin
              </button>
            )}
          </nav>

          <div className="nav-right">
            <button className="logout-btn" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>

        </div>

      </header>

      {/* CONTENIDO */}
      <main className="dashboard-content">
        {vista === "resumen" && <Resumen />}
        {vista === "historial" && <HistorialServicios />}
        {vista === "formulario" && <FormularioMantenimiento />}

        {vista === "admin" && (rol === "admin" || rol === 2) && (
          <AdminUsuarios />
        )}
      </main>

    </div>
  );
}