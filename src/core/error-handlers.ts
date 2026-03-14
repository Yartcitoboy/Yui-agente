/**
 * Escuchadores de sistema globales para prevenir cierres inesperados (silent crashes)
 * Especialmente útil en despliegues como Render para ver los logs reales.
 */
export function setupErrorHandlers() {
    process.on("unhandledRejection", (reason, promise) => {
        console.error("[Unhandled Rejection] at:", promise, "reason:", reason);
    });
    
    process.on("uncaughtException", (error) => {
        console.error("[Uncaught Exception]", error);
        // Descomentar lo de abajo si deseas que el bot no muera nunca
        // Sin embargo, NodeJS sugiere apagar el proceso para evitar un estado corrupto
        process.exit(1);
    });
}
