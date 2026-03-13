import { getCurrentTime, getCurrentTimeDef } from "./get_current_time.js";
import { executeGogCommand, executeGogCommandDef } from "./gog_tool.js";
import { runCommand, runCommandDef, writeFile, writeToFileDef, readFile, readFileDef } from "./coding_tools.js";
import { saveMemory, saveMemoryDef } from "./memory_tool.js";
import { webSearch, webSearchDef } from "./web_search_tool.js";

// List of available tools for the LLM
export const availableTools = [
    getCurrentTimeDef,
    executeGogCommandDef,
    runCommandDef,
    writeToFileDef,
    readFileDef,
    saveMemoryDef,
    webSearchDef
];

// Execute a tool based on its name and arguments
export async function executeTool(name: string, args: any, options?: { userId?: string }): Promise<string> {
    try {
        switch (name) {
            case "get_current_time":
                return await getCurrentTime();
            case "execute_gog_command":
                return await executeGogCommand(args.args);
            case "run_command":
                return await runCommand(args.command, args.cwd);
            case "write_file":
                return await writeFile(args.filePath, args.content);
            case "read_file":
                return await readFile(args.filePath);
            case "save_memory":
                if (!options?.userId) return "Error: userId not provided context to tool.";
                return await saveMemory(options.userId, args.key, args.value);
            case "web_search":
                return await webSearch(args.query);
            default:
                throw new Error(`Tool ${name} not found`);
        }
    } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return `Error executing tool: ${error instanceof Error ? error.message : String(error)}`;
    }
}
