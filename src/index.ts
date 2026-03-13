import { bot } from "./bot/bot.js";
import { envInfo } from "./config.js";
import * as http from "http";

// Iniciar servidor HTTP básico para Render (Web Service Free Tier) ANTES de iniciar el bot
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Yui Agent is running!');
    res.end();
}).listen(PORT, "0.0.0.0", () => {
    console.log(`[Servidor] Escuchando en el puerto ${PORT} (Requerido por Render)`);
});

// Main entry point
async function bootstrap() {
    console.log("========================================");
    console.log("🚀 Iniciando OpenGravity (Yui Agent)...");
    console.log("========================================");
    
    // Log configuration status safely
    console.log("[Config] Base de datos configurada en:", envInfo.DB_PATH);
    console.log("[Config] Telegram Bot Token:", envInfo.TELEGRAM_BOT_TOKEN ? "✅ Configurado" : "❌ Falta");
    console.log("[Config] Groq API Key:", envInfo.GROQ_API_KEY ? "✅ Configurado" : "❌ Falta");
    console.log("[Config] ElevenLabs API Key:", envInfo.ELEVENLABS_API_KEY ? `✅ Configurado (${envInfo.ELEVENLABS_API_KEY.substring(0, 4)}...${envInfo.ELEVENLABS_API_KEY.slice(-4)})` : "❌ Falta");
    console.log(`[Config] Usuarios autorizados: ${envInfo.TELEGRAM_ALLOWED_USER_IDS.length}`);

    // Import GOG CLI token if running in Render and file exists
    try {
        const _fs = await import("fs");
        const _execSync = await import("child_process").then(m => m.execSync);
        const isWindows = process.platform === 'win32';
        const gogCmd = isWindows ? ".\\bin\\gog.exe" : "./bin/gog";

        // Primero, configurar credenciales base obligatoriamente en Render
        const secretPath = "/etc/secrets/client_secret.json";
        if (_fs.existsSync(secretPath)) {
            _execSync(`${gogCmd} auth credentials ${secretPath}`, { stdio: "ignore" });
            console.log("✅ Credenciales de OAuth configuradas para gogcli.");
        }

        // Luego importar TODOS los tokens que encuentre (múltiples cuentas)
        const secretsDir = "/etc/secrets";
        if (_fs.existsSync(secretsDir)) {
             const files = _fs.readdirSync(secretsDir);
             const tokenFiles = files.filter(f => f.startsWith("token") && f.endsWith(".json"));
             for (const file of tokenFiles) {
                  try {
                      const tokenPath = `${secretsDir}/${file}`;
                      _execSync(`${gogCmd} auth tokens import ${tokenPath}`, { stdio: "pipe" });
                      console.log(`✅ Token de sesión importado: ${file}`);
                  } catch (err: any) {
                      console.log(`⚠️ Error importando token ${file}: ${err.message}`);
                      if (err.stdout) console.log(`   Stdout: ${err.stdout.toString()}`);
                      if (err.stderr) console.log(`   Stderr: ${err.stderr.toString()}`);
                  }
             }
             
             // Asignamos una cuenta por defecto a GROQ si hay al menos un token
             for (const file of tokenFiles) {
                  try {
                      const tokenData = JSON.parse(_fs.readFileSync(`${secretsDir}/${file}`, "utf-8"));
                      if (tokenData && tokenData.email && !process.env.GOG_ACCOUNT) {
                          process.env.GOG_ACCOUNT = tokenData.email;
                          console.log(`[GOG] Cuenta por defecto asignada: ${process.env.GOG_ACCOUNT}`);
                          break;
                      }
                  } catch (e) {
                      // Ignorar tokens malformados para la cuenta por defecto
                  }
             }
        }
    } catch (e) {
        console.log("⚠️ No se pudo inicializar la configuración de GOG CLI:", e);
    }

    try {
        console.log("[Bot] Iniciando conexión con Telegram (Long Polling)...");
        // Start the bot (this promise will hang while the bot is running)
        await bot.start({
            onStart: (botInfo) => {
                console.log(`✅ ¡Yui está en línea! Sesión iniciada como @${botInfo.username}`);
                console.log("Presiona Ctrl+C para detener.");
            }
        });
    } catch (error) {
        console.error("❌ Error fatal al iniciar la aplicación:", error);
        process.exit(1);
    }
}

// Global error handlers to prevent silent crashes
process.on("unhandledRejection", (reason, promise) => {
    console.error("[Unhandled Rejection] at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("[Uncaught Exception]", error);
    process.exit(1);
});

// Run the application
bootstrap();
