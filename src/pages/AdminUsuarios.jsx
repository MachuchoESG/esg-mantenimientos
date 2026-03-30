import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  setDoc
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

import "./AdminUsuarios.css";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  // NUEVO: modal crear usuario
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "tecnico"
  });

  const obtenerUsuarios = async () => {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    const lista = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsuarios(lista);
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Deshabilitar usuario
  const deshabilitarUsuario = async (id) => {
    await updateDoc(doc(db, "usuarios", id), {
      activo: false
    });
    obtenerUsuarios();
  };

  // Abrir modal password
  const abrirModal = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setMostrarModal(true);
  };

  // Cerrar modal password
  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevaPassword("");
  };

  // Cambiar contraseña (simulado)
  const cambiarPassword = async () => {
    if (!nuevaPassword) return;

    alert("Aquí debes conectar con backend (Firebase Admin SDK)");

    cerrarModal();
  };

  //  CREAR USUARIO
  const crearUsuario = async () => {
    try {
      if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) {
        alert("Completa todos los campos");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        nuevoUsuario.email,
        nuevoUsuario.password
      );

      const uid = userCredential.user.uid;

      await setDoc(doc(db, "usuarios", uid), {
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        activo: true,
        createdAt: new Date()
      });

      alert("Usuario creado correctamente");

      // limpiar
      setNuevoUsuario({
        nombre: "",
        email: "",
        password: "",
        rol: "tecnico"
      });

      setMostrarCrear(false);
      obtenerUsuarios();

    } catch (error) {
      console.error(error);
      alert("Error al crear usuario");
    }
  };

  return (
    <div className="admin-container">

      <h2>Panel de Administración</h2>

      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="buscador"
      />

      {/* BOTÓN CREAR */}
      <button className="btn-crear" onClick={() => setMostrarCrear(true)}>
        Crear Usuario
      </button>

      {/* TABLA */}
      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {usuariosFiltrados.map((user) => (
            <tr key={user.id}>
              <td data-label="Nombre">{user.nombre}</td>
              <td data-label="Correo">{user.email}</td>
              <td data-label="Rol">{user.rol}</td>
              <td data-label="Acciones">
                <button onClick={() => abrirModal(user)}>
                  Cambiar contraseña
                </button>

                <button onClick={() => deshabilitarUsuario(user.id)}>
                  Deshabilitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL PASSWORD */}
      {mostrarModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Cambiar contraseña</h3>

            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />

            <div className="modal-buttons">
              <button onClick={cambiarPassword}>
                Guardar
              </button>

              <button onClick={cerrarModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR USUARIO */}
      {mostrarCrear && (
        <div className="modal">
          <div className="modal-content">
            <h3>Crear Usuario</h3>

            <input
              type="text"
              placeholder="Nombre"
              value={nuevoUsuario.nombre}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
              }
            />

            <input
              type="email"
              placeholder="Correo"
              value={nuevoUsuario.email}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={nuevoUsuario.password}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
              }
            />

            <select
              value={nuevoUsuario.rol}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })
              }
            >
              <option value="tecnico">Técnico</option>
            </select>

            <div className="modal-buttons">
              <button onClick={crearUsuario}>
                Crear
              </button>

              <button onClick={() => setMostrarCrear(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}