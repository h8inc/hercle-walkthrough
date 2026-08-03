import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  const store = getStore("proto-comments");
  const read = async (): Promise<any[]> =>
    ((await store.get("all", { type: "json" })) as any[]) || [];

  if (req.method === "GET") {
    return Response.json(await read());
  }

  if (req.method === "POST") {
    let b: any;
    try {
      b = await req.json();
    } catch {
      return new Response("bad json", { status: 400 });
    }
    const all = await read();

    if (b && b.action === "resolve") {
      const c = all.find((x) => x.id === b.id);
      if (c) c.resolved = !!b.resolved;
    } else {
      const name = String(b.name || "").trim().slice(0, 40);
      const text = String(b.text || "").trim().slice(0, 2000);
      const anchor = String(b.anchor || "").slice(0, 80);
      if (!name || !text || !anchor)
        return new Response("missing fields", { status: 400 });
      if (all.length > 2000) return new Response("full", { status: 429 });
      all.push({
        id: crypto.randomUUID(),
        ts: Date.now(),
        name,
        text,
        anchor,
        parentId: b.parentId ? String(b.parentId) : null,
        resolved: false,
      });
    }
    await store.set("all", JSON.stringify(all));
    return Response.json({ ok: true });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/comments" };
