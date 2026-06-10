import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./pages/firebase";
import { obtenerPendientes, limpiarPendientes } from "./offlineService";
import { hayInternet } from "./utils/network";

export const syncPendientes = async () => {

  if (!hayInternet()) return;

  const pendientes = obtenerPendientes();
  if (pendientes.length === 0) return;

  const nuevosPendientes = [];

  for (const item of pendientes) {

    try {

      await addDoc(collection(db, "mantenimientos"), {
        ...item,
        estadoSync: 1,
        createdAt: serverTimestamp()
      });

    } catch (error) {

      console.error("Error sincronizando:", error);

      // reintentos
      if (item.intentos < 3) {
        nuevosPendientes.push({
          ...item,
          intentos: item.intentos + 1
        });
      }
    }
  }

  limpiarPendientes(nuevosPendientes);
};