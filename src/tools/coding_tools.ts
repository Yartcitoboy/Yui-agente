import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export const runCommandDef = {
    type: "function",
    function: {
        name: "run_command",
        description: "Ejecuta un comando en la terminal. Útil para instalar dependencias, iniciar proyectos (ej. npx create-vite), correr tests o scripts.",
        parameters: {
            type: "object",
            properties: {
                command: { type: "string", description: "El comando a ejecutar (ej: 'npm init -y' o 'mkdir src')." },
                cwd: { type: "string", description: "Directorio de trabajo actual para el comando (opcional). Por defecto es la raíz del bot." }
            },
            required: ["command"]
        }
    }
} as const;

export const writeToFileDef = {
    type: "function",
    function: {
        name: "write_file",
        description: "Escribe o sobrescribe un archivo con código o texto de forma completa. Crea también los directorios necesarios. Indispensable para crear aplicaciones.",
        parameters: {
            type: "object",
            properties: {
                filePath: { type: "string", description: "Ruta del archivo (ej: 'mi_app/src/index.js')." },
                content: { type: "string", description: "Código o contenido a escribir. Debe ser el archivo completo." }
            },
            required: ["filePath", "content"]
        }
    }
} as const;

export const readFileDef = {
    type: "function",
    function: {
        name: "read_file",
        description: "Lee el contenido de un archivo del disco para que puedas revisar código existente o comprobar cambios.",
        parameters: {
            type: "object",
            properties: {
                filePath: { type: "string", description: "Ruta del archivo a leer." }
            },
            required: ["filePath"]
        }
    }
} as const;

export async function runCommand(command: string, cwd?: string): Promise<string> {
    try {
        const { stdout, stderr } = await execAsync(command, { cwd: cwd || process.cwd() });
        let out = stdout;
        if (stderr) out += `\nStderr: ${stderr}`;
        if (!out.trim()) return `Comando ejecutado con éxito sin salida en consola.`;
        return out.substring(0, 4000);
    } catch (e: any) {
        return `Error al ejecutar el comando: ${e.message}\n` + (e.stdout ? `Stdout: ${e.stdout}\n` : "") + (e.stderr ? `Stderr: ${e.stderr}` : "");
    }
}

export async function writeFile(filePath: string, content: string): Promise<string> {
    try {
        const absolutePath = path.resolve(process.cwd(), filePath);
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, content, "utf-8");
        return `Archivo modificado/creado exitosamente en: ${absolutePath}`;
    } catch (e: any) {
        return `Error al escribir el archivo: ${e.message}`;
    }
}

export async function readFile(filePath: string): Promise<string> {
    try {
        const absolutePath = path.resolve(process.cwd(), filePath);
        const content = fs.readFileSync(absolutePath, "utf-8");
        return content.substring(0, 8000);
    } catch (e: any) {
        return `Error al leer el archivo: ${e.message}`;
    }
}
