# Puesta en marcha — Agenda Concejal Abarca v2

Todo el código ya está escrito y probado en su sintaxis. Lo que falta son pasos
que solo tú puedes hacer porque requieren tus propias cuentas (Google, GitHub,
Anthropic) — no tengo forma de iniciar sesión por ti. Van en orden, cada uno
toma pocos minutos.

## 1. Crear el proyecto en Firebase

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
2. "Crear un proyecto" → nómbralo, por ejemplo, `agenda-concejal-abarca`.
3. Dentro del proyecto, ve a **Configuración del proyecto → Uso y facturación** y cambia al plan **Blaze** (pago por uso). Pide tarjeta de crédito, pero con tu volumen de uso (una persona, un celular) el costo esperado es **$0** — Blaze igual incluye la cuota gratis de Spark, solo permite pasarte si la superas. Las funciones programadas (recordatorios) necesitan este plan; no funcionan en Spark.

## 2. Activar los servicios que usa la app

Dentro del proyecto:

- **Authentication** → pestaña "Sign-in method" → habilita **Google**.
- **Firestore Database** → "Crear base de datos" → modo producción → región cercana, por ejemplo `southamerica-east1` (São Paulo).
- **Cloud Messaging** → no requiere activación manual, pero en **Configuración del proyecto → Cloud Messaging** genera un **par de claves Web Push (VAPID)** — cópialo, lo necesitas en el paso 4.

## 3. Agregar la app web y obtener la configuración

1. En la vista general del proyecto, clic en el ícono `</>` ("Agregar app" → Web).
2. Ponle un apodo (ej. "Agenda Concejal Web") — no necesitas Firebase Hosting, ya usas GitHub Pages.
3. Copia el objeto `firebaseConfig` que te muestra (apiKey, authDomain, projectId, etc.).

## 4. Completar `firebase-init.js`

Abre `firebase-init.js` (en la carpeta que te entrego) y reemplaza:

- El objeto `firebaseConfig` completo, con lo que copiaste en el paso 3.
- `VAPID_KEY`, con la clave del paso 2.
- `AI_CONVERT_URL`, con la URL de la función `aiConvert` — la obtienes recién al final del paso 6, vuelve aquí después.

## 5. Instalar Firebase CLI y conectar el proyecto

En tu computador (con Node.js instalado):

```
npm install -g firebase-tools
firebase login
```

Dentro de la carpeta del proyecto (la que descomprimiste de este entregable):

```
firebase use --add
```

Elige el proyecto que creaste en el paso 1.

## 6. Guardar tu llave de Anthropic como secreto y desplegar las funciones

```
firebase functions:secrets:set ANTHROPIC_API_KEY
```

Te va a pedir que pegues tu llave (la misma que usas para la API de Claude — si no tienes una, se genera en [console.anthropic.com](https://console.anthropic.com)).

```
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

Al terminar, la terminal te muestra la URL de la función `aiConvert` (algo como
`https://aiconvert-xxxxx-uc.a.run.app`). Pégala en `AI_CONVERT_URL` dentro de
`firebase-init.js` (paso 4).

## 7. Subir los archivos al repositorio

Reemplaza en tu repo `LikenAustral/Agenda-Concejal` estos archivos por los que
te entrego: `index.html`, `manifest.json`, `sw.js`, `firebase-init.js`,
`icons/icon-192.png`, `icons/icon-512.png`. Luego:

```
git add .
git commit -m "Agrega calendario, sincronización y recordatorios push reales"
git push
```

GitHub Pages se actualiza solo en un par de minutos.

## 8. Probar en tu celular

1. Abre `https://likenaustral.github.io/Agenda-Concejal` en Chrome Android.
2. Inicia sesión con Google.
3. Ve a la pestaña Tareas y activa "Recordatorios" cuando te lo pida.
4. Menú de Chrome → "Instalar app" (o "Agregar a pantalla de inicio") — ahora sí debería ofrecerse como app instalable de verdad, con ícono propio.
5. Crea una tarea con recordatorio en 6-7 minutos y cierra la app por completo — la notificación debería llegar sola.

## Qué quedó fuera de este primer alcance

- Editar un evento ya creado (por ahora solo se puede eliminar y volver a crearlo).
- Vista semanal del calendario (quedó solo la mensual, como en la maqueta que revisaste).
- Exportar/respaldar los datos a un archivo — con Firestore ya tienes respaldo automático en la nube, pero no un botón de "descargar mi info".

Si quieres, seguimos iterando sobre cualquiera de estos puntos, o te ayudo en vivo con alguno de los pasos de arriba si te trabas en algo.
