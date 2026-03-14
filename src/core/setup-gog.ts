import * as fs from "fs";
import { execSync } from "child_process";

/**
 * Hook para importar automáticamente los tokens generados si se ejecuta en la nube (ej. Render)
 * Evita configuraciones manuales o errores de CLI por contraseñas en keyring de Linux.
 */
export async function setupGogCli() {
    try {
        const isWindows = process.platform === 'win32';
        const gogCmd = isWindows ? ".\\bin\\gog.exe" : "./bin/gog";

        // 1. Configurar credenciales base obligatoriamente en Render si el archivo existe
        const secretPath = "/etc/secrets/client_secret.json";
        if (fs.existsSync(secretPath)) {
            execSync(`${gogCmd} auth credentials ${secretPath}`, { stdio: "ignore" });
            console.log("✅ Credenciales de OAuth configuradas para gogcli.");
        }

        // 2. Importar TODOS los tokens (de múltiples cuentas)
        const secretsDir = "/etc/secrets";
        if (fs.existsSync(secretsDir)) {
             // Configurar una contraseña genérica para el llavero en Linux para evitar el prompt TTY (Error 409/Keyring)
             process.env.GOG_KEYRING_PASSWORD = "render_keyring_pass_1234!";

             const files = fs.readdirSync(secretsDir);
             const tokenFiles = files.filter(f => f.startsWith("token") && f.endsWith(".json"));
             
             for (const file of tokenFiles) {
                  try {
                      const tokenPath = `${secretsDir}/${file}`;
                      execSync(`${gogCmd} auth tokens import ${tokenPath}`, { stdio: "pipe" });
                      console.log(`✅ Token de sesión importado: ${file}`);
                  } catch (err: any) {
                      console.log(`⚠️ Error importando token ${file} (Aviso interno)`);
                      // Silenced to keep console clean, errors can be logged here if needed
                  }
             }
             
             // 3. Asignar una cuenta de correo por defecto
             for (const file of tokenFiles) {
                  try {
                      const tokenData = JSON.parse(fs.readFileSync(`${secretsDir}/${file}`, "utf-8"));
                      if (tokenData && tokenData.email && !process.env.GOG_ACCOUNT) {
                          process.env.GOG_ACCOUNT = tokenData.email;
                          console.log(`[GOG] Cuenta por defecto auto-asignada: ${process.env.GOG_ACCOUNT}`);
                          break;
                      }
                  } catch (e) {
                      // Ignorar JSON malformados
                  }
             }
        }
    } catch (e: any) {
        console.log("⚠️ No se pudo inicializar la configuración auto de GOG CLI:", e.message);
    }
}
