# Alpha11 Dashboard

Dashboard generado en Google AI Studio, preparado para correr localmente y para publicarse en Vercel leyendo datos desde Google Sheets.

## Arquitectura

- GitHub guarda solo el codigo del dashboard.
- Vercel publica la app y ejecuta las rutas `/api/*` y `/auth/callback`.
- Google Sheets sigue siendo la fuente de datos.
- Las credenciales de Google y el ID de la hoja deben vivir en variables de entorno, no en GitHub.

## Variables de entorno

Crea un archivo `.env` local o configura estas variables en Vercel:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_SHEET_ID=
GOOGLE_REDIRECT_URI=
```

Para un dashboard publico donde los socios no tengan que iniciar sesion, usa tambien una cuenta de servicio y comparte la hoja con su email:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

Con esas dos variables configuradas, Vercel lee Google Sheets desde el servidor y cualquier persona con la URL puede ver el dashboard sin OAuth.

En Vercel, `GOOGLE_REDIRECT_URI` debe usar la URL final del proyecto:

```bash
https://TU-PROYECTO.vercel.app/auth/callback
```

Esa misma URL debe agregarse en Google Cloud Console dentro de las credenciales OAuth, en "Authorized redirect URIs".

## Correr localmente

```bash
npm install
npm run dev
```

Luego abre:

```bash
http://localhost:3000
```

Para probar OAuth en local, agrega tambien esta URL como redirect URI autorizado en Google Cloud:

```bash
http://localhost:3000/auth/callback
```

## Publicar en Vercel

1. Sube este proyecto a GitHub.
2. En Vercel, crea un proyecto importando ese repositorio.
3. Configura `GOOGLE_SHEET_ID`.
4. Para acceso publico sin login, configura `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_PRIVATE_KEY` y comparte la hoja con ese email.
5. Si vas a usar OAuth personal como respaldo, configura tambien `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI`.
6. Despliega.
7. Copia la URL final de Vercel.
8. Si usas OAuth, agrega `https://TU-PROYECTO.vercel.app/auth/callback` en Google Cloud OAuth.
9. Entra al dashboard publicado y usa "Sincronizar" para leer Google Sheets.

## Nota sobre datos

`public/data.xlsx` esta ignorado por Git para evitar publicar un Excel con datos reales. La app puede correr sin ese archivo y sincronizar desde Google Sheets.
