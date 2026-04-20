import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import * as XLSX from "xlsx";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json());
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "" // Redirect URI will be set dynamically
);

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

const getSheetsErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Error desconocido";
};

const normalizeGoogleSheetId = (value?: string) => {
  if (!value) return undefined;

  const trimmed = value.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || trimmed;
};

const getGoogleSheetId = () => {
  return normalizeGoogleSheetId(
    process.env.GOOGLE_SHEET_ID ||
    process.env.GOOGLE_SPREADSHEET_ID ||
    process.env.GOOGLE_SHEETS_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ||
    process.env.SPREADSHEET_URL
  );
};

const hasServiceAccountCredentials = () => {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY;
};

const hasPublicSheetsExport = () => {
  return process.env.GOOGLE_SHEETS_PUBLIC_EXPORT === "true";
};

const getServiceAccountAuth = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: SCOPES,
  });
};

const quoteSheetNameForA1 = (name: string) => {
  return `'${name.replace(/'/g, "''")}'`;
};

const getPublicWorkbookData = async (sheetId: string) => {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  const response = await fetch(exportUrl);

  if (!response.ok) {
    throw new Error(`No se pudo descargar la hoja publica (${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("spreadsheet") && !contentType.includes("octet-stream")) {
    throw new Error("Google no devolvio un archivo Excel. Revisa que la hoja sea publica con permiso de lectura.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true, dateNF: "yyyy-mm-dd" });
  const allData: Record<string, any[]> = {};

  for (const name of workbook.SheetNames) {
    const worksheet = workbook.Sheets[name];
    allData[name] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  }

  return allData;
};

const getBaseUrl = (req: express.Request) => {
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || (isProduction ? "https" : "http");

  return `${protocol}://${host}`;
};

const getRedirectUri = (req: express.Request) => {
  return process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl(req)}/auth/callback`;
};

// API Routes
app.get("/api/auth/google/status", (req, res) => {
  const tokensCookie = req.cookies.google_tokens;
  res.json({
    authenticated: hasServiceAccountCredentials() || hasPublicSheetsExport() || !!tokensCookie,
    mode: hasServiceAccountCredentials() ? "service_account" : hasPublicSheetsExport() ? "public_export" : "oauth",
  });
});

app.get("/api/auth/google/url", (req, res) => {
  const redirectUri = getRedirectUri(req);
  
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    redirect_uri: redirectUri,
    prompt: "consent"
  });
  res.json({ url });
});

app.get("/api/auth/google/login", (req, res) => {
  const redirectUri = getRedirectUri(req);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).send(`
      <div style="font-family: sans-serif; padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
        <h2 style="margin-top: 0;">Error de Configuración</h2>
        <p>Faltan las credenciales de Google OAuth en las variables de entorno.</p>
        <p>Por favor, configura <strong>GOOGLE_CLIENT_ID</strong> y <strong>GOOGLE_CLIENT_SECRET</strong> en el menú de <strong>Settings</strong>.</p>
        <p>Asegúrate también de añadir esta URL como <strong>URI de redireccionamiento autorizado</strong> en tu Google Cloud Console:</p>
        <code style="background: #eee; padding: 4px 8px; border-radius: 4px; display: block; margin: 10px 0;">${redirectUri}</code>
        <button onclick="window.close()" style="padding: 8px 16px; cursor: pointer; margin-top: 10px;">Cerrar ventana</button>
      </div>
    `);
  }
  
  console.log("Generating Auth URL with redirectUri:", redirectUri);

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    redirect_uri: redirectUri,
    prompt: "consent"
  });
  res.redirect(url);
});

app.get("/api/auth/google/debug", (req, res) => {
  const redirectUri = getRedirectUri(req);
  
  res.send(`
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Diagnóstico de Google OAuth</h2>
      <p>Para solucionar el error <strong>redirect_uri_mismatch</strong>, copia la siguiente URL y añádela a tus "URIs de redireccionamiento autorizados" en Google Cloud Console:</p>
      <code style="background: #eee; padding: 10px; border-radius: 4px; display: block; margin: 10px 0; font-size: 1.2em; border: 1px solid #ccc;">${redirectUri}</code>
      <p><strong>Pasos:</strong></p>
      <ol>
        <li>Ve a <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Credentials</a>.</li>
        <li>Edita tu ID de cliente OAuth 2.0.</li>
        <li>Añade la URL de arriba en la sección "URIs de redireccionamiento autorizados".</li>
        <li>Guarda los cambios y espera 1-2 minutos.</li>
      </ol>
      <button onclick="window.location.href='/api/auth/google/login'" style="padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Intentar Conectar de Nuevo</button>
    </div>
  `);
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code as string;
  const redirectUri = getRedirectUri(req);

  console.log("Handling callback with redirectUri:", redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: redirectUri
    });
    
    // Store tokens in a cookie (simplified for this applet)
    res.cookie("google_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: getBaseUrl(req).startsWith("https://"),
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <head>
          <title>Autenticación Exitosa</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8f9fa; }
            .card { background: white; padding: 2rem; border-radius: 8px; shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .success-icon { color: #28a745; font-size: 48px; margin-bottom: 1rem; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✓</div>
            <h2>¡Autenticación Exitosa!</h2>
            <p>Ya puedes cerrar esta ventana y volver al dashboard.</p>
            <script>
              // Try to notify the opener
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                // Give it a moment to send the message before closing
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                // If no opener, maybe it was opened in the same window or target="_blank" without opener
                console.log("No window.opener found");
              }
            </script>
            <button onclick="window.close()">Cerrar Ventana</button>
            <p style="margin-top: 20px; font-size: 0.8rem; color: #666;">Si la ventana no se cierra sola, haz clic en el botón de arriba.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Error en la autenticación");
  }
});

app.get("/api/sheets/data", async (req, res) => {
  const tokensCookie = req.cookies.google_tokens;
  const useServiceAccount = hasServiceAccountCredentials();
  const usePublicExport = hasPublicSheetsExport();

  if (!useServiceAccount && !usePublicExport && !tokensCookie) {
    return res.status(401).json({ error: "No autenticado con Google" });
  }

  const sheetId = getGoogleSheetId();
  if (!sheetId) {
    return res.status(400).json({ error: "No hay ID de Google Sheet configurado" });
  }

  try {
    if (usePublicExport) {
      const allData = await getPublicWorkbookData(sheetId);
      return res.json({ data: allData });
    }

    const auth = useServiceAccount ? getServiceAccountAuth() : oauth2Client;
    if (!useServiceAccount) {
      const tokens = JSON.parse(tokensCookie);
      oauth2Client.setCredentials(tokens);
    }

    const sheets = google.sheets({ version: "v4", auth });
    
    // Fetch all sheet names first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    
    const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title).filter(Boolean) as string[];
    
    const allData: Record<string, any[]> = {};
    
    for (const name of sheetNames) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${quoteSheetNameForA1(name)}!A:ZZ`,
        });

        allData[name] = response.data.values || [];
      } catch (error) {
        console.error(`Error fetching sheet "${name}":`, error);
        return res.status(500).json({
          error: `Error al leer la pestaña "${name}": ${getSheetsErrorMessage(error)}`,
        });
      }
    }

    res.json({ data: allData });
  } catch (error) {
    console.error("Error fetching sheets data:", error);
    res.status(500).json({ error: `Error al obtener datos de Google Sheets: ${getSheetsErrorMessage(error)}` });
  }
});

// Vite middleware for local development. Vercel runs this file as a serverless
// function, so it must export the Express app without opening a listening port.
if (!isVercel && !isProduction) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else if (!isVercel) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

if (!isVercel) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
