export type BlockType =
  | "greeting"
  | "text"
  | "scripture"
  | "event"
  | "giving"
  | "button"
  | "image"
  | "divider"
  | "footer";

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
    label: "Events Schedule",
    defaults: {
      title: "Sunday Service",
      date: "",
      location: "",
      description: "",
    },
  },

  giving: {
    label: "Giving",
    defaults: {
      title: "Tithe & Kingdom Giving",
      description:
        "Support local outreach, global missions, and our sanctuary maintenance.",
      buttonLabel: "Give Securely Online",
      url: "",
    },
  },

  button: {
    label: "CTA Button",
    defaults: {
      label: "Register Now",
      url: "",
    },
  },

  image: {
    label: "Image Banner",
    defaults: {
      url: "",
      alt: "",
    },
  },

  divider: {
    label: "Divider",
    defaults: {},
  },

  footer: {
    label: "Footer",
    defaults: {
      churchName: "Glory Worship Church",
      address: "",
      notice:
        "You are receiving this because you subscribed to our church newsletter.",
      preferencesLabel: "Manage Preferences",
      unsubscribeLabel: "Unsubscribe",
      socialUrl: "",
      websiteUrl: "",
      contactUrl: "",
    },
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

    return {
      id: block.id,
      type,
      fields,
    };
  });
}

export function blocksToText(blocks: NewsletterBlock[]): string {
  return blocks
    .map((block) => Object.values(block.fields).filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

export interface RenderOptions {
  subject: string;
  headerImageUrl?: string;
  previewText?: string;
  churchName?: string;

  // Supply real recipient-specific URLs from the sending flow.
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export function renderNewsletter(
  blocks: NewsletterBlock[],
  {
    subject,
    headerImageUrl = "",
    previewText = "",
    churchName = "Glory Worship Church",
    unsubscribeUrl = "",
    preferencesUrl = "",
  }: RenderOptions
): string {
  const text = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br/>");

  const section = (html: string) => `
    <tr>
      <td style="padding:10px 24px;">
        ${html}
      </td>
    </tr>
  `;

  function renderLinkOrLabel(
    label: string,
    url: string,
    style: string
  ): string {
    const validUrl = safeUrl(url);

    return validUrl
      ? `
        <a href="${escapeHtml(validUrl)}" style="${style}">
          ${text(label)}
        </a>
      `
      : `
        <span style="${style}">
          ${text(label)}
        </span>
      `;
  }

  function renderFooterIcon(
    symbol: string,
    label: string,
    url: string
  ): string {
    const validUrl = safeUrl(url);

    const style =
      "display:inline-block;margin:0 7px;color:#8C9298;text-decoration:none;font-size:14px;line-height:20px;";

    return validUrl
      ? `
        <a
          href="${escapeHtml(validUrl)}"
          aria-label="${escapeHtml(label)}"
          title="${escapeHtml(label)}"
          style="${style}"
        >${symbol}</a>
      `
      : `
        <span
          title="${escapeHtml(label)}"
          style="${style}"
        >${symbol}</span>
      `;
  }

  const validatedBlocks = parseBlocks(blocks);

  const orderedBlocks = [
    ...validatedBlocks.filter((block) => block.type !== "footer"),
    ...validatedBlocks.filter((block) => block.type === "footer"),
  ];

  const content = orderedBlocks
    .map(({ type, fields: f }) => {
      switch (type) {
        case "greeting":
          return section(`
            <div style="background:#F8FAFB;border-radius:8px;padding:14px 16px;">
              <h2 style="margin:0;font-size:18px;line-height:1.5;color:#002B3D;">
                ${text(f.text ?? "")}
              </h2>
            </div>
          `);

        case "text":
          return section(`
            <div style="background:#F8FAFB;border-radius:8px;padding:14px 16px;">
              ${
                f.heading
                  ? `
                    <h2 style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#002B3D;">
                      ${text(f.heading)}
                    </h2>
                  `
                  : ""
              }

              <p style="margin:0;font-size:14px;line-height:1.8;color:#334155;">
                ${text(f.body ?? "")}
              </p>
            </div>
          `);

        case "scripture":
          return section(`
            <div style="
              background-color:#C3D1D9;
              background-image:linear-gradient(120deg,#DCE5E8 0%,#C3D1D9 48%,#AEBFCB 100%);
              border:1px dashed #B79C42;
              border-radius:8px;
              padding:18px;
            ">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td
                    width="22"
                    valign="top"
                    style="color:#8A7427;font-size:24px;line-height:1;"
                  >
                    &ldquo;
                  </td>

                  <td valign="top">
                    <p style="margin:0;font-size:13px;line-height:1.7;color:#193A4B;">
                      ${text(f.verse ?? "")}
                    </p>

                    ${
                      f.reference
                        ? `
                          <p style="margin:8px 0 0;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.4px;color:#806B24;">
                            ${text(f.reference)}
                          </p>
                        `
                        : ""
                    }
                  </td>
                </tr>
              </table>
            </div>
          `);

        case "event":
          return section(`
            <div style="background:#F4F6F8;border-radius:8px;padding:18px;">
              <h2 style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#002B3D;">
                ${text(f.title ?? "")}
              </h2>

              ${
                f.date
                  ? `
                    <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#64748B;">
                      ${text(f.date)}
                    </p>
                  `
                  : ""
              }

              ${
                f.location
                  ? `
                    <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#64748B;">
                      ${text(f.location)}
                    </p>
                  `
                  : ""
              }

              ${
                f.description
                  ? `
                    <p style="margin:8px 0 0;font-size:13px;line-height:1.7;color:#334155;">
                      ${text(f.description)}
                    </p>
                  `
                  : ""
              }
            </div>
          `);

        case "giving": {
          const title = f.title || "Tithe & Kingdom Giving";
          const description = f.description ?? "";
          const buttonLabel = f.buttonLabel || "Give Securely Online";
          const givingUrl = safeUrl(f.url ?? "");

          const buttonStyle =
            "display:inline-block;max-width:100%;box-sizing:border-box;" +
            "padding:12px 14px;background:#002B3D;color:#FFFFFF;" +
            "border-radius:6px;text-decoration:none;" +
            "font-family:Arial,sans-serif;font-size:12px;" +
            "font-weight:bold;line-height:18px;text-align:center;" +
            "white-space:normal;overflow-wrap:break-word;";

          const buttonContent = `&#9825;&nbsp;${escapeHtml(
            buttonLabel.replace(/[\r\n]+/g, " ")
          )}`;

          const button = givingUrl
            ? `
              <a
                class="giving-button"
                href="${escapeHtml(givingUrl)}"
                style="${buttonStyle}"
              >
                ${buttonContent}
              </a>
            `
            : `
              <span class="giving-button" style="${buttonStyle}">
                ${buttonContent}
              </span>
            `;

          return section(`
            <div style="background:#E8E9EC;border-radius:8px;padding:16px;">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="width:100%;"
              >
                <tr>
                  <td
                    class="giving-details"
                    valign="top"
                    style="padding-right:12px;"
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="width:100%;"
                    >
                      <tr>
                        <td
                          width="36"
                          valign="top"
                          style="width:36px;"
                        >
                          <div style="width:28px;height:28px;border-radius:50%;background:#FFDC64;text-align:center;line-height:28px;color:#80691D;font-size:16px;">
                            &#36;
                          </div>
                        </td>

                        <td valign="top">
                          <p style="margin:0;font-size:12px;font-weight:bold;line-height:1.5;color:#002B3D;">
                            ${text(title)}
                          </p>

                          <p style="margin:4px 0 0;font-size:11px;line-height:1.6;color:#64748B;overflow-wrap:break-word;">
                            ${text(description)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td
                    class="giving-action"
                    width="174"
                    align="right"
                    valign="middle"
                    style="width:174px;"
                  >
                    ${button}
                  </td>
                </tr>
              </table>
            </div>
          `);
        }

        case "button": {
          const buttonStyle =
            "display:inline-block;padding:12px 22px;background:#FFD85B;color:#66500F;text-decoration:none;font-size:13px;font-weight:bold;border-radius:8px;";

          return section(`
            <div style="background:#F8FAFB;border-radius:8px;text-align:center;padding:20px 16px;">
              ${renderLinkOrLabel(f.label ?? "", f.url ?? "", buttonStyle)}
            </div>
          `);
        }

        case "image": {
          const url = safeUrl(f.url ?? "");

          if (!url) return "";

          return section(`
            <img
              src="${escapeHtml(url)}"
              alt="${escapeHtml(f.alt ?? "")}"
              width="552"
              style="display:block;width:100%;max-width:552px;height:auto;border:0;border-radius:8px;"
            />
          `);
        }

        case "divider":
          return section(`
            <hr style="border:0;border-top:1px solid #E2E8F0;margin:8px 0;"/>
          `);

        case "footer": {
          const name = f.churchName ?? churchName;
          const address = f.address ?? "";

          const identity = [
            name ? text(name) : "",
            address ? text(address) : "",
          ]
            .filter(Boolean)
            .join(" &nbsp;·&nbsp; ");

          const linkStyle =
            "color:#91969C;text-decoration:underline;font-size:10px;line-height:1.6;";

          const preferences = renderLinkOrLabel(
            f.preferencesLabel ?? "Manage Preferences",
            preferencesUrl,
            linkStyle
          );

          const unsubscribe = renderLinkOrLabel(
            f.unsubscribeLabel ?? "Unsubscribe",
            unsubscribeUrl,
            linkStyle
          );

          return section(`
            <div style="padding:12px 4px 8px;text-align:center;">
              <div style="margin-bottom:8px;">
                ${renderFooterIcon("&#8599;", "Social page", f.socialUrl ?? "")}

                ${renderFooterIcon(
                  "&#9678;",
                  "Church website",
                  f.websiteUrl ?? ""
                )}

                ${renderFooterIcon(
                  "&#9993;",
                  "Contact page",
                  f.contactUrl ?? ""
                )}
              </div>

              ${
                identity
                  ? `
                    <p style="margin:0;font-size:10px;line-height:1.6;color:#5D6268;">
                      ${identity}
                    </p>
                  `
                  : ""
              }

              ${
                f.notice
                  ? `
                    <p style="margin:6px 0 0;font-size:9px;line-height:1.6;color:#9A9FA5;">
                      ${text(f.notice)}
                    </p>
                  `
                  : ""
              }

              <p style="margin:4px 0 0;font-size:10px;line-height:1.6;color:#91969C;">
                ${preferences}
                &nbsp;·&nbsp;
                ${unsubscribe}
              </p>
            </div>
          `);
        }

        default:
          throw new Error(`Unsupported newsletter block type: ${String(type)}`);
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

  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .giving-details,
      .giving-action {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .giving-details {
        padding-right: 0 !important;
      }

      .giving-action {
        padding-top: 16px !important;
        text-align: center !important;
      }

      .giving-button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 14px 12px !important;
        font-size: 14px !important;
        line-height: 20px !important;
        white-space: normal !important;
      }
    }
  </style>
</head>

<body style="margin:0;background:#F4F6F8;font-family:Arial,sans-serif;color:#002B3D;">
  ${
    previewText
      ? `
        <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
          ${escapeHtml(previewText)}
        </div>
      `
      : ""
  }

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:24px 8px;">
        <table
          role="presentation"
          width="600"
          cellspacing="0"
          cellpadding="0"
          style="width:100%;max-width:600px;background:#FFFFFF;border-radius:8px;overflow:hidden;"
        >
          <tr>
            <td style="background:#002B3D;padding:28px 24px;text-align:center;color:#FFFFFF;">
              <h1 style="margin:0;font-size:26px;line-height:1.3;">
                ${escapeHtml(churchName)}
              </h1>

              <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#DCE5E8;">
                ${escapeHtml(subject)}
              </p>
            </td>
          </tr>

          ${
            header
              ? `
                <tr>
                  <td>
                    <img
                      src="${escapeHtml(header)}"
                      alt=""
                      width="600"
                      style="display:block;width:100%;height:auto;border:0;"
                    />
                  </td>
                </tr>
              `
              : ""
          }

          <tr>
            <td style="height:12px;font-size:0;line-height:0;">
              &nbsp;
            </td>
          </tr>

          ${content}

          <tr>
            <td style="height:16px;font-size:0;line-height:0;">
              &nbsp;
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
