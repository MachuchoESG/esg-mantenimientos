import { Preferences } from '@capacitor/preferences';

const KEY = "pendientes_sync";

export const guardarOffline = async (data) => {
  const actuales = JSON.parse(localStorage.getItem(KEY)) || [];

  actuales.push({
    ...data,
    estadoSync: 0,
    intentos: 0
  });

  localStorage.setItem(KEY, JSON.stringify(actuales));
};

export const obtenerPendientes = () => {
  return JSON.parse(localStorage.getItem(KEY)) || [];
};

export const limpiarPendientes = (nuevaLista) => {
  localStorage.setItem(KEY, JSON.stringify(nuevaLista));
};