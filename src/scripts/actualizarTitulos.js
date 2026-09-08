import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../pages/firebase";

const actualizarTitulos = async () => {
  try {

    const q = query(
      collection(db, "mantenimientos"),
      where("tecnico", "==", "Angel Cerda")
    );

    const snapshot = await getDocs(q);

    console.log(`Registros encontrados: ${snapshot.size}`);

    if (snapshot.empty) {
      console.log("No se encontraron registros.");
      return;
    }

    const batch = writeBatch(db);

        snapshot.docs.forEach((doc) => {

        batch.update(doc.ref, {
        titulo: "Renovacion de antivirus"
         });

    });

    await batch.commit();

    console.log("Todos los registros fueron actualizados correctamente.");

        } catch (error) {

    console.error("Error actualizando registros:", error);

  }
};

actualizarTitulos();