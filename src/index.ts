import { bot } from "./bot/bot.js";
import { envInfo } from "./config.js";

// Core initializations
import { startRenderServer } from "./core/server.js";
import { setupGogCli } from "./core/setup-gog.js";
import { setupErrorHandlers } from "./core/error-handlers.js";

// ======= INICIALIZACIÓN PRINCIPAL =======
async function bootstrap() {
    // 0. Proteger contra caídas silenciosas
    setupErrorHandlers();

    // 1. Iniciar servidor "Dummy" en Free Tier para que Render no tire Timeout Error.
    startRenderServer();

    console.log("========================================");
    console.log("🚀 Iniciando OpenGravity (Yui Agent)...");
    console.log("========================================");
    
    // 2. Imprimir información de Configuración Principal en logs
    console.log("[Config] Base de datos configurada en:", envInfo.DB_PATH);
    console.log("[Config] Telegram Bot Token:", envInfo.TELEGRAM_BOT_TOKEN ? "✅ Configurado" : "❌ Falta");
    console.log("[Config] Groq API Key:", envInfo.GROQ_API_KEY ? "✅ Configurado" : "❌ Falta");
    console.log("[Config] ElevenLabs API Key:", envInfo.ELEVENLABS_API_KEY ? `✅ Configurado (${envInfo.ELEVENLABS_API_KEY.substring(0, 4)}......${envInfo.ELEVENLABS_API_KEY.slice(-4)})` : "❌ Falta");
    console.log(`[Config] Usuarios autorizados: ${envInfo.TELEGRAM_ALLOWED_USER_IDS.length}`);

    // 3. Preparar integraciones complejas (Google OAuth/CLI tokens en Nube)
    await setupGogCli();

    // 4. Iniciar bot (Este bloque dejará la app corriendo infinitamente por el long-polling)
    try {
        console.log("[Bot] Iniciando conexión con Telegram (Long Polling)...");
        await bot.start({
            onStart: (botInfo) => {
                console.log(`✅ ¡Yui está en línea! Sesión iniciada como @${botInfo.username}`);
                console.log("Presiona Ctrl+C para detener.");
            }
        });
    } catch (error) {
        console.error("❌ Error fatal al iniciar Telegram:", error);
        process.exit(1);
    }
}

// Ejecutar
bootstrap();
