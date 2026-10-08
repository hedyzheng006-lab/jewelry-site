// A small MCP (Model Context Protocol) server for the product catalog.
//
// MCP is a standard way for AI apps (Claude, Claude Code, Copilot…) to call outside tools.
// This endpoint speaks the "Streamable HTTP" transport in its simplest form: each request
// is one JSON-RPC message, each response is plain JSON, and no session state is kept.
//
// Auth: every request needs "Authorization: Bearer <MCP_API_KEY>". Without MCP_API_KEY set,
// the server stays closed. The tools are read-only, so a leaked key exposes only public data.
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { BRAND_NAME } from "@/lib/claude";
import { formatPrice, getProduct, products } from "@/lib/products";

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"];

// ---------- Tools ----------

const SearchInput = z.object({
  keyword: z.string().optional().describe("Word to match in name, description, stone or tags, e.g. 'pearl' or 'bridal'"),
  category: z.enum(["necklace", "earrings"]).optional(),
  metal: z.enum(["gold", "gold-plated", "silver", "silver-tone", "rose-gold"]).optional(),
  maxPrice: z.number().optional().describe("Maximum price in USD"),
});
const GetInput = z.object({ id: z.string().describe("Product id from search_products") });

const tools = [
  {
    name: "search_products",
    title: "Search products",
    description: `Search the ${BRAND_NAME} jewelry catalog. All filters are optional; with none, returns every product.`,
    inputSchema: SearchInput,
    annotations: { readOnlyHint: true },
    run: (args: z.infer<typeof SearchInput>) => {
      const kw = args.keyword?.toLowerCase();
      return products
        .filter(
          (p) =>
            (!args.category || p.category === args.category) &&
            (!args.metal || p.metal === args.metal) &&
            (args.maxPrice === undefined || p.price <= args.maxPrice) &&
            (!kw || `${p.name} ${p.description} ${p.stone ?? ""} ${p.tags.join(" ")}`.toLowerCase().includes(kw)),
        )
        .map((p) => ({ id: p.id, name: p.name, category: p.category, metal: p.metal, stone: p.stone, price: formatPrice(p.price) }));
    },
  },
  {
    name: "get_product",
    title: "Get product details",
    description: "Full details of one product: description, story, materials, tags and price.",
    inputSchema: GetInput,
    annotations: { readOnlyHint: true },
    run: (args: z.infer<typeof GetInput>) => {
      const p = getProduct(args.id);
      if (!p) throw new Error(`No product with id ${args.id}`);
      const { stoneColor: _, image: __, ...details } = p;
      return { ...details, price: formatPrice(p.price) };
    },
  },
];

function toolList() {
  return tools.map(({ name, title, description, inputSchema, annotations }) => {
    const { $schema: _, ...schema } = z.toJSONSchema(inputSchema);
    return { name, title, description, inputSchema: schema, annotations };
  });
}

// ---------- JSON-RPC plumbing ----------

const Rpc = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

const ok = (id: unknown, result: unknown) => Response.json({ jsonrpc: "2.0", id, result });
const fail = (id: unknown, code: number, message: string, status = 200) =>
  Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status });

function authorized(req: Request): boolean | "not-configured" {
  const key = process.env.MCP_API_KEY?.trim();
  if (!key) return "not-configured";
  const given = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const auth = authorized(req);
  if (auth === "not-configured") return fail(null, -32001, "MCP server is not configured (MCP_API_KEY is not set)", 503);
  if (!auth) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized" } }), {
      status: 401,
      headers: { "Content-Type": "application/json", "WWW-Authenticate": 'Bearer realm="mcp"' },
    });
  }

  const parsed = Rpc.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(null, -32600, "Invalid JSON-RPC request", 400);
  const { id, method, params } = parsed.data;

  // Notifications (no id) need no answer.
  if (id === undefined) return new Response(null, { status: 202 });

  switch (method) {
    case "initialize": {
      const requested = String(params?.protocolVersion ?? "");
      return ok(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: `${BRAND_NAME.toLowerCase()}-catalog`, title: `${BRAND_NAME} catalog`, version: "1.0.0" },
        instructions: `Read-only access to the ${BRAND_NAME} jewelry catalog. Prices are in USD.`,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: toolList() });
    case "tools/call": {
      const tool = tools.find((t) => t.name === params?.name);
      if (!tool) return fail(id, -32602, `Unknown tool: ${String(params?.name)}`);
      const args = tool.inputSchema.safeParse(params?.arguments ?? {});
      if (!args.success) return ok(id, { isError: true, content: [{ type: "text", text: `Invalid arguments: ${args.error.message}` }] });
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = tool.run(args.data as any);
        return ok(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: { result } });
      } catch (e) {
        return ok(id, { isError: true, content: [{ type: "text", text: (e as Error).message }] });
      }
    }
    default:
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

// This server does not open server-to-client streams.
export function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
