import * as http from "http";

/**
 * Iniciar servidor HTTP básico para Render (Web Service Free Tier).
 * Debe ejecutarse ANTES de iniciar tareas pesadas o long-polling.
 */
export function startRenderServer() {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write('Yui Agent is running!');
        res.end();
    }).listen(PORT, "0.0.0.0", () => {
        console.log(`[Servidor] Escuchando en el puerto ${PORT} (Requerido por Render)`);
    });
}
