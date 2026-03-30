import { useState, useEffect } from "react"; // 👈 agregado
import { signOut, onAuthStateChanged } from "firebase/auth"; // 👈 agregado
import { auth, db } from "./firebase"; // 👈 agregado db
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore"; // 👈 agregado

import FormularioMantenimiento from "./FormularioMantenimiento";
import HistorialServicios from "./HistorialServicios";
import Resumen from "./Resumen";
import AdminUsuarios from "./AdminUsuarios"; // 👈 agregado
import logo from "../images/esg.png";

import "./dashboard.css";

export default function Dashboard() {
  const [vista, setVista] = useState("resumen");
  const [rol, setRol] = useState(null); // 👈 agregado
  const navigate = useNavigate();

  // 🔥 Obtener usuario correctamente (sin romper login)
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

  return (
    <div className="dashboard-container">
      
      {/* NAVBAR */}
      <header className="dashboard-nav">
        
      <div className="nav-logo">
      <img src={logo} alt="ESG Logo" className="nav-logo-img" />
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

          {/* 🔥 BOTÓN ADMIN */}
          {(rol === "admin" || rol === 2) && (
            <button 
              className={vista === "admin" ? "active" : ""}
              onClick={() => setVista("admin")}
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

      </header>

      {/* CONTENIDO */}
      <main className="dashboard-content">
        {vista === "resumen" && <Resumen />}
        {vista === "historial" && <HistorialServicios />}
        {vista === "formulario" && <FormularioMantenimiento />}

        {/* 🔥 PANEL ADMIN */}
        {vista === "admin" && (rol === "admin" || rol === 2) && (
          <AdminUsuarios />
        )}
      </main>

    </div>
  );
}