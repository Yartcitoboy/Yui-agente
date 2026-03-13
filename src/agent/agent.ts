import { systemPrompt } from "./prompts.js";
import { callLLM, LLMMessage } from "../llm/client.js";
import { executeTool } from "../tools/registry.js";
import { getHistory, saveMessage } from "../memory/firebase.js";

const MAX_ITERATIONS = 5;

export async function processUserMessage(userId: string, content: string): Promise<string> {
    // 1. Save user message to memory
    await saveMessage(userId, "user", content);

    // 2. Retrieve conversation history (limit to last 20 to keep context window manageable)
    const history = await getHistory(userId, 20);

    // 3. Construct messages array for the LLM
    const messages: LLMMessage[] = [
        { role: "system", content: systemPrompt }
    ];

    for (const msg of history) {
        messages.push({
            role: msg.role === "system" ? "assistant" : msg.role as "user" | "assistant",
            content: msg.content
        });
    }

    // 4. Agent Loop
    let iteration = 0;
    while (iteration < MAX_ITERATIONS) {
        iteration++;
        
        console.log(`[Agent] Iteration ${iteration} for user ${userId}`);
        const responseMessage = await callLLM(messages);

        // Append assistant's response to the conversation flow (not yet to DB)
        messages.push(responseMessage);

        // Check if the model wants to call a tool
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            console.log(`[Agent] Tool calls requested:`, responseMessage.tool_calls.map((t: any) => t.function.name));
            
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments || "{}");
                
                // Execute the tool
                const toolResult = await executeTool(functionName, functionArgs);
                
                // Append the tool result back to the messages
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: functionName,
                    content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult)
                });
            }
            // Loop continues to let the LLM see the tool output and generate a final response
        } else {
            // No tool calls, this is the final final response to the user
            const finalReply = responseMessage.content || "Lo siento, no pude generar una respuesta.";
            
            // Save assistant's final text response to database
            await saveMessage(userId, "assistant", finalReply);
            
            return finalReply;
        }
    }

    // If we exceed max iterations
    const errorMsg = "Lo siento, tuve problemas procesando la solicitud y alcancé el límite de intentos.";
    await saveMessage(userId, "assistant", errorMsg);
    return errorMsg;
}
