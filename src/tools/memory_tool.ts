import { saveUserProfile } from "../memory/firebase.js";

export const saveMemoryDef = {
    type: "function",
    function: {
        name: "save_memory",
        description: "Guarda un recuerdo, preferencia o dato importante sobre el usuario a largo plazo en memoria. Úsalo SIEMPRE que el usuario mencione sus gustos, rutinas, su nombre, o algo que te pida que debas recordar permanentemente para el futuro.",
        parameters: {
            type: "object",
            properties: {
                key: { type: "string", description: "Un nombre clave corto para este recuerdo (ej. 'lenguaje_favorito', 'hora_despertar', 'nombre')" },
                value: { type: "string", description: "El valor o detalle del recuerdo (ej. 'Node.js', '7:00 AM', 'Isaias')" }
            },
            required: ["key", "value"]
        }
    }
} as const;

export async function saveMemory(userId: string, key: string, value: string): Promise<string> {
    try {
        await saveUserProfile(userId, key, value);
        return `Recuerdo '${key}' = '${value}' guardado exitosamente a largo plazo. En la próxima iteración o inicio de chat, ya lo recordarás automáticamente en tu contexto base.`;
    } catch (e: any) {
        return `Error guardando memoria: ${e.message}`;
    }
}
