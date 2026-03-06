import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Resumen() {

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {

    const cargarDatos = async () => {

      const snapshot = await getDocs(collection(db, "mantenimientos"));

      const registros = snapshot.docs.map(doc => doc.data());

      setTotal(registros.length);

      const conteo = {};

      registros.forEach(item => {
        const empresa = item.empresaId || "Sin empresa";
        conteo[empresa] = (conteo[empresa] || 0) + 1;
      });

      const dataGrafica = Object.keys(conteo).map(key => ({
        empresa: key,
        servicios: conteo[key]
      }));

      setData(dataGrafica);
    };

    cargarDatos();

  }, []);

  return (
    <div>

      <h2>Resumen General</h2>

      {/* 🔹 Cards */}
      <div className="cards">
        <div className="card">
          <h3>Total Servicios</h3>
          <p>{total}</p>
        </div>
      </div>

      {/* 🔹 Gráfica */}
      <div className="chart-container">
        <h3>Servicios por Empresa</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="empresa" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="servicios" />
          </BarChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}