// Configuración e inicialización de Firebase (SDK modular v10, vía CDN — sin paso de build).
// Reemplaza los valores TODO con los que te entrega la consola de Firebase
// (Configuración del proyecto → Tus apps → app web). Ver SETUP.md paso 5.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
  getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot,
  query, serverTimestamp, enableIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import {
  getMessaging, getToken, deleteToken, onMessage, isSupported as messagingIsSupported
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyCUn4xvmK6ueGjzJXQBJbdnWuF4nirilcg',
  authDomain: 'agenda-concejal-abarca.firebaseapp.com',
  projectId: 'agenda-concejal-abarca',
  storageBucket: 'agenda-concejal-abarca.firebasestorage.app',
  messagingSenderId: '1026429322226',
  appId: '1:1026429322226:web:6c0c352a1f53c1aef8216b'
};

// Llave VAPID pública para Web Push (Configuración del proyecto → Cloud Messaging → Generar par de claves).
export const VAPID_KEY = 'BNp0U2SVhBMXUjSatmFRUmoKubWUkifzQz01NCYaBOluOX2o5WlIUZ0NIlQuD-p-niAbr5WGVlB4hWruqLq2Iwk';

// URL de la Cloud Function que hace de proxy seguro a la API de Anthropic (ver SETUP.md paso 6-8).
// Con Firebase Functions v2 suele verse así una vez desplegada:
// https://aiconvert-XXXXXXXXXX-uc.a.run.app
export const AI_CONVERT_URL = 'https://us-central1-agenda-concejal-abarca.cloudfunctions.net/aiConvert';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Deja una copia local (IndexedDB) para que la app abra con tus últimos datos aunque no haya señal.
enableIndexedDbPersistence(db).catch(() => { /* varias pestañas abiertas u navegador sin soporte: se ignora */ });

export function loginConGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export function logout() {
  return signOut(auth);
}
export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

// Firestore: todo vive bajo users/{uid}/items/{id} (tareas y eventos) y
// users/{uid}/notes/{id} (bloc de notas) — ver firestore.rules.
export function itemsCollection(uid) {
  return collection(db, 'users', uid, 'items');
}
export function itemDoc(uid, id) {
  return doc(db, 'users', uid, 'items', id);
}
export function notesCollection(uid) {
  return collection(db, 'users', uid, 'notes');
}
export function noteDoc(uid, id) {
  return doc(db, 'users', uid, 'notes', id);
}
export { setDoc, updateDoc, deleteDoc, onSnapshot, query, serverTimestamp };

// Cloud Messaging: pide permiso y registra el token del dispositivo para que
// la función programada (checkReminders) sepa a dónde enviar los recordatorios.
export async function registrarPush(uid) {
  const supported = await messagingIsSupported();
  if (!supported) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  const messaging = getMessaging(app);
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (token) {
    await setDoc(doc(db, 'users', uid, 'fcmTokens', token), { token, updated: serverTimestamp() });
  }
  onMessage(messaging, (payload) => {
    // Notificación mientras la app está abierta en primer plano.
    new Notification(payload.notification?.title || 'Recordatorio', { body: payload.notification?.body || '' });
  });
  return token;
}

// El navegador no deja "revocar" el permiso de notificaciones por código
// (eso solo lo puede hacer el usuario desde Chrome). Lo que sí podemos hacer
// es dejar de mandarle avisos a ESTE dispositivo: borramos su token guardado
// en Firestore (así checkReminders ya no lo encuentra) y el registro del
// navegador. Si luego vuelve a activarlas, registrarPush() genera uno nuevo.
export async function desactivarPush(uid) {
  const supported = await messagingIsSupported();
  if (!supported) return;
  try {
    const messaging = getMessaging(app);
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (token) {
      await deleteDoc(doc(db, 'users', uid, 'fcmTokens', token));
      await deleteToken(messaging);
    }
  } catch (e) {
    console.warn('No se pudo eliminar el token FCM', e);
  }
}