import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import FormularioMantenimiento from "./pages/FormularioMantenimiento";
import Dashboard from "./pages/Dashboard";

import { syncPendientes } from "./syncService";

function App() {

  useEffect(() => {

    syncPendientes();

    const interval = setInterval(() => {
      syncPendientes();
    }, 10000);

    return () => clearInterval(interval);

  }, []);

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/formulario"
          element={<FormularioMantenimiento />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

      </Routes>

    </BrowserRouter>

  );
}

export default App;