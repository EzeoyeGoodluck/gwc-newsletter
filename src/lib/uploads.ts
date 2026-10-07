import path from "path";

export function uploadDir() {
return path.resolve(
  /* turbopackIgnore: true */
  process.env.UPLOAD_DIR || "./uploads"
);
}

export function uploadUrl(filename: string) {
  return `/api/uploads/${filename}`;
}

export function filenameFromUrl(url: string | null) {
  if (!url?.startsWith("/api/uploads/")) return null;
  const name = url.slice("/api/uploads/".length);
  return /^[\w.-]+$/.test(name) ? name : null;
}
