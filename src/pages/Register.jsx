import { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";


export default function Register() {

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        nombre: nombre,
        email: email,
        rol: "tecnico",
        createdAt: new Date()
      });

      alert("Técnico registrado correctamente");

    } catch (error) {
      console.log(error);
      alert("Error al registrar");
    }
  };

  return (
    <div className="login-container">

      <div className="login-box">
        <h2>Registro de Técnico</h2>

        <form onSubmit={handleRegister}>

          <input
            type="text"
            placeholder="Nombre"
            onChange={(e) => setNombre(e.target.value)}
          />

          <input
            type="email"
            placeholder="Correo"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Registrarse</button>

        </form>
      </div>

    </div>
  );
}