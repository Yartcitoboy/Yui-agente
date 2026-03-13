import { execFile } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const execFileAsync = promisify(execFile);
const gogBinary = path.resolve(process.cwd(), "bin", "gog.exe");

export const executeGogCommandDef = {
    type: "function",
    function: {
        name: "execute_gog_command",
        description: "Ejecuta un comando del CLI de Google (gog) para interactuar con Gmail, Calendar, Drive, Sheets, Docs, etc. IMPORTANTE: El primer argumento nunca debe ser 'gog'. Pasa un array exacto como ['gmail', 'send', '--to', '...']",
        parameters: {
            type: "object",
            properties: {
                args: {
                    type: "array",
                    items: { type: "string" },
                    description: "Los argumentos que se pasarán al binario gog."
                }
            },
            required: ["args"]
        }
    }
} as const;

export async function executeGogCommand(args: string[]): Promise<string> {
    try {
        if (!fs.existsSync(gogBinary)) {
            return "Error: el binario gog no se encuentra en bin/gog.exe.";
        }
        
        // Execute the command directly avoiding shell injection
        const { stdout, stderr } = await execFileAsync(gogBinary, args, { 
            cwd: process.cwd(),
            // Optionally wrap env if needed
        });
        
        let out = stdout.trim();
        if (!out) {
             out = "El comando finalizó exitosamente sin output.";
        }
        if (stderr.trim()) {
            out += `\n[Nota del sistema]: ${stderr.trim()}`;
        }
        
        // Return truncated output if it's too long
        if (out.length > 5000) {
            return out.substring(0, 5000) + "\n...[Salida truncada]";
        }
        return out;
    } catch (error: any) {
        console.error("GOG Error:", error);
        return `El comando gog falló con error: ${error.message}\nStdErr: ${error.stderr || "nada"}\nStdOut: ${error.stdout || "nada"}`;
    }
}
