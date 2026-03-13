export const webSearchDef = {
    type: "function",
    function: {
        name: "web_search",
        description: "Busca información en la web (Wikipedia/Internet) para responder a preguntas de interés general, actualidad, o datos que no sepas.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Término a buscar (ej. 'Nodejs ventajas', 'Inteligencia Artificial')" }
            },
            required: ["query"]
        }
    }
} as const;

export async function webSearch(query: string): Promise<string> {
    try {
        const url = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
        const req = await fetch(url);
        const data: any = await req.json();

        if (data && data.query && data.query.search && data.query.search.length > 0) {
            const results = data.query.search.slice(0, 3).map((r: any) => {
                // Remove HTML tags from snippets
                let snippet = r.snippet.replace(/<\/?[^>]+(>|$)/g, "");
                return `- ${r.title}: ${snippet}`;
            }).join("\n");
            return `Resultados de la Web para "${query}":\n${results}`;
        }
        return "No se encontraron resultados relevantes.";
    } catch (e: any) {
        return `Error buscando en la web: ${e.message}`;
    }
}
