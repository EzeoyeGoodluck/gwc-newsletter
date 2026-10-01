import { readFile } from "fs/promises";
import path from "path";
import { uploadDir } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!/^[\w.-]+$/.test(file))
    return new Response("Not found", { status: 404 });

  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(path.join(uploadDir(), file));
    return new Response(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Security-Policy": "script-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
