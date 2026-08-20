// Configuración e inicialización de Firebase (SDK modular v10, vía CDN — sin paso de build).

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
  getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot,
  query, serverTimestamp, enableIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import {
  getMessaging, getToken, onMessage, isSupported as messagingIsSupported
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyCUn4xvmK6ueGjzJXQBJbdnWuF4nirilcg',
  authDomain: 'agenda-concejal-abarca.firebaseapp.com',
  projectId: 'agenda-concejal-abarca',
  storageBucket: 'agenda-concejal-abarca.firebasestorage.app',
  messagingSenderId: '1026429322226',
  appId: '1:1026429322226:web:6c0c352a1f53c1aef8216b'
};

export const VAPID_KEY = 'BNp0U2SVhBMXUjSatmFRUmoKubWUkifzQz01NCYaBOluOX2o5WlIUZ0NIlQuD-p-niAbr5WGVlB4hWruqLq2Iwk';

export const AI_CONVERT_URL = 'https://us-central1-agenda-concejal-abarca.cloudfunctions.net/aiConvert';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
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
    new Notification(payload.notification?.title || 'Recordatorio', { body: payload.notification?.body || '' });
  });
  return token;
}