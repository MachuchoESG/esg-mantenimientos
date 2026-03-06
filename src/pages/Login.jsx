import { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {

    await signInWithEmailAndPassword(auth, email, password);

navigate("/dashboard");

  } catch (error) {
    console.log(error);
    alert("Correo o contraseña incorrectos");
  }
};

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Módulo de Mantenimientos</h2>

        <form onSubmit={handleLogin}>

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

          <button type="submit">Ingresar</button>

        <p style={{marginTop:"15px"}}>
            ¿No tienes cuenta? <a href="/register">Registrarse</a>
        </p>

        </form>
      </div>
    </div>
  );
}