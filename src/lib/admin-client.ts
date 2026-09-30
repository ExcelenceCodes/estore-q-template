export type UploadPayload = {
  filename: string;
  mime: string;
  base64: string;
  width?: number | undefined;
  height?: number | undefined;
  alt?: string | undefined;
};

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

async function dimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (typeof createImageBitmap !== "function" || !file.type.startsWith("image/")) return {};
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {};
  }
}

/** Turns a picked file into the payload accepted by the uploadMedia server function. */
export async function filePayload(file: File, alt?: string): Promise<UploadPayload> {
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be 8 MB or smaller.");
  const [base64, size] = await Promise.all([readBase64(file), dimensions(file)]);
  return {
    filename: file.name,
    mime: file.type || "application/octet-stream",
    base64,
    alt,
    ...size,
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
