export const getCurrentTimeDef = {
    type: "function",
    function: {
        name: "get_current_time",
        description: "Obtiene la fecha y hora actual local. Útil cuando el usuario pregunta qué hora es, qué día es hoy, o para saber el momento exacto.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
} as const;

export async function getCurrentTime(): Promise<string> {
    const now = new Date();
    // Use Spanish locale since Yui speaks Spanish
    return now.toLocaleString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        timeZoneName: 'short'
    });
}
