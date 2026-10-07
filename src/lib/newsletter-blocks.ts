export type BlockType =
  | "greeting"
  | "text"
  | "scripture"
  | "event"
  | "button"
  | "image"
  | "divider";

export interface NewsletterBlock {
  id: string;
  type: BlockType;
  fields: Record<string, string>;
}

export interface BlockDefinition {
  label: string;
  defaults: Record<string, string>;
}

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  greeting: {
    label: "Greeting",
    defaults: {
      text: "Hi {{memberName}},",
    },
  },
  text: {
    label: "Heading & Body",
    defaults: {
      heading: "You're invited!",
      body: "Add your church announcement here.",
    },
  },
  scripture: {
    label: "Scripture Quote",
    defaults: {
      verse: "Add your Bible verse here.",
      reference: "",
    },
  },
  event: {
    label: "Event",
    defaults: {
      title: "Sunday Service",
      date: "",
      location: "",
      description: "",
    },
  },
  button: {
    label: "Button",
    defaults: {
      label: "Register Now",
      url: "",
    },
  },
  image: {
    label: "Image",
    defaults: {
      url: "",
      alt: "",
    },
  },
  divider: {
    label: "Divider",
    defaults: {},
  },
};

export const BLOCK_TYPES = Object.keys(BLOCK_DEFINITIONS) as BlockType[];

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

// Validate JSON received from clients or loaded from the database.
export function parseBlocks(value: unknown): NewsletterBlock[] {
  if (!Array.isArray(value) || value.length > 100) {
    throw new Error("The newsletter must contain at most 100 blocks.");
  }

  const ids = new Set<string>();

  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Invalid newsletter block.");
    }

    const block = item as Record<string, unknown>;

    if (
      typeof block.id !== "string" ||
      !block.id ||
      block.id.length > 100 ||
      ids.has(block.id) ||
      typeof block.type !== "string" ||
      !BLOCK_TYPES.includes(block.type as BlockType) ||
      !block.fields ||
      typeof block.fields !== "object" ||
      Array.isArray(block.fields)
    ) {
      throw new Error("Invalid newsletter block.");
    }

    ids.add(block.id);

    const type = block.type as BlockType;
    const source = block.fields as Record<string, unknown>;
    const fields: Record<string, string> = {};

    for (const [key, fallback] of Object.entries(
      BLOCK_DEFINITIONS[type].defaults
    )) {
      const field = source[key] ?? fallback;

      if (typeof field !== "string" || field.length > 20_000) {
        throw new Error(`Invalid field in ${BLOCK_DEFINITIONS[type].label}.`);
      }

      fields[key] = field;
    }

    return { id: block.id, type, fields };
  });
}

export function blocksToText(blocks: NewsletterBlock[]): string {
  return blocks
    .map((block) => Object.values(block.fields).filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

interface RenderOptions {
  subject: string;
  headerImageUrl?: string;
  previewText?: string;
  churchName?: string;
}

export function renderNewsletter(
  blocks: NewsletterBlock[],
  {
    subject,
    headerImageUrl = "",
    previewText = "",
    churchName = "Glory Worship Church",
  }: RenderOptions
): string {
  const text = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br/>");

  const section = (html: string) => `
    <tr>
      <td style="padding:12px 24px;">${html}</td>
    </tr>
  `;

  const content = blocks
    .map(({ type, fields: f }) => {
      switch (type) {
        case "greeting":
          return section(
            `<h2 style="margin:0;font-size:22px;">${text(f.text)}</h2>`
          );

        case "text":
          return section(`
          ${
            f.heading
              ? `<h2 style="margin:0 0 12px;font-size:20px;">${text(f.heading)}</h2>`
              : ""
          }
          <p style="margin:0;line-height:1.7;">${text(f.body)}</p>
        `);

        case "scripture":
          return section(`
          <div style="background:#F5F1DF;border-left:4px solid #F6C84C;padding:20px;">
            <p style="margin:0;line-height:1.7;">${text(f.verse)}</p>
            ${
              f.reference
                ? `<p style="margin:12px 0 0;font-size:12px;font-weight:bold;">${text(f.reference)}</p>`
                : ""
            }
          </div>
        `);

        case "event":
          return section(`
          <div style="background:#F4F6F8;padding:20px;">
            <h2 style="margin:0 0 12px;font-size:20px;">${text(f.title)}</h2>
            ${f.date ? `<p style="margin:0 0 8px;">${text(f.date)}</p>` : ""}
            ${f.location ? `<p style="margin:0 0 8px;">${text(f.location)}</p>` : ""}
            ${f.description ? `<p style="margin:0;line-height:1.7;">${text(f.description)}</p>` : ""}
          </div>
        `);

        case "button": {
          const url = safeUrl(f.url);

          return section(`
          <div style="text-align:center;padding:8px;">
            ${
              url
                ? `<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;background:#F6C84C;color:#1B2A4A;text-decoration:none;font-weight:bold;border-radius:8px;">${text(f.label)}</a>`
                : `<span style="display:inline-block;padding:14px 24px;background:#F6C84C;color:#1B2A4A;border-radius:8px;">${text(f.label)}</span>`
            }
          </div>
        `);
        }

        case "image": {
          const url = safeUrl(f.url);

          return url
            ? section(
                `<img src="${escapeHtml(url)}" alt="${escapeHtml(f.alt)}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;"/>`
              )
            : "";
        }

        case "divider":
          return section(
            `<hr style="border:0;border-top:1px solid #E2E8F0;margin:8px 0;"/>`
          );
      }
    })
    .join("");

  const header = safeUrl(headerImageUrl);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;background:#F4F6F8;font-family:Arial,sans-serif;color:#1B2A4A;">
  ${
    previewText
      ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(previewText)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:24px 8px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
          style="width:100%;max-width:600px;background:#FFFFFF;">
          <tr>
            <td style="background:#1B2A4A;padding:28px 24px;text-align:center;color:#FFFFFF;">
              <h1 style="margin:0;font-size:26px;">${escapeHtml(churchName)}</h1>
              <p style="margin:10px 0 0;font-size:14px;">${escapeHtml(subject)}</p>
            </td>
          </tr>
          ${
            header
              ? `<tr><td><img src="${escapeHtml(header)}" alt="" width="600" style="display:block;width:100%;height:auto;border:0;"/></td></tr>`
              : ""
          }
          ${content}
          <tr><td style="height:24px;"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
