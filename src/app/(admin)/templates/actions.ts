"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { renderNewsletter } from "@/lib/newsletter-blocks";

import {
  NEWSLETTER_TEMPLATE_PRESETS,
  parseTemplateDesign,
} from "@/lib/newsletter-template-presets";

import type { Template } from "@/components/templates/newsletter-templates";

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

const PRESET_IDS = NEWSLETTER_TEMPLATE_PRESETS.map((preset) => preset.id);

function updatedLabel(date: Date) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86_400_000)
  );

  if (days === 0) return "Updated today";
  if (days === 1) return "Updated 1 day ago";
  if (days < 7) return `Updated ${days} days ago`;

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Updated ${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }

  const months = Math.floor(days / 30);

  return `Updated ${months} month${months > 1 ? "s" : ""} ago`;
}

type TemplateRow = Awaited<ReturnType<typeof prisma.template.findMany>>[number];

function toUi(row: TemplateRow): Template {
  const design = parseTemplateDesign(row.design);

  return {
    id: row.id,
    title: row.name,
    description: row.description ?? "",
    imageUrl: row.thumbnailUrl ?? "",
    category: row.category,
    updatedLabel: updatedLabel(row.updatedAt),
    popular: row.isPopular,
    design,
    previewHtml: design
      ? renderNewsletter(design.blocks, {
          subject: design.subjectLine,
          previewText: design.previewText,
          headerImageUrl: design.headerImageUrl,
        })
      : null,
  };
}

async function ensurePresets() {
  await prisma.$transaction(
    NEWSLETTER_TEMPLATE_PRESETS.map((preset) => {
      const html = renderNewsletter(preset.design.blocks, {
        subject: preset.design.subjectLine,
        previewText: preset.design.previewText,
        headerImageUrl: preset.design.headerImageUrl,
      });

      return prisma.template.upsert({
        where: {
          id: preset.id,
        },
        create: {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          category: preset.category,
          isPopular: preset.isPopular,
          isDefault: true,
          thumbnailUrl: null,
          design: preset.design as unknown as Prisma.InputJsonValue,
          html,
        },

        // Do not overwrite an existing preset every time
        // someone visits the library.
        update: {},
      });
    })
  );
}

export async function listTemplates(): Promise<Result<Template[]>> {
  const user = await requireUser();

  if (!can(user.role, "newsletters.view")) {
    return {
      ok: false,
      message: "You do not have permission to view templates.",
    };
  }

  try {
    const existingCount = await prisma.template.count({
      where: {
        id: { in: PRESET_IDS },
      },
    });

    if (existingCount < PRESET_IDS.length) {
      if (!can(user.role, "newsletters.edit")) {
        return {
          ok: false,
          message:
            "An owner, administrator, or editor must open the library once to initialize the three templates.",
        };
      }

      await ensurePresets();
    }

    const rows = await prisma.template.findMany({
      where: {
        id: { in: PRESET_IDS },
      },
    });

    const order = new Map(PRESET_IDS.map((id, index) => [id, index]));

    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return {
      ok: true,
      data: rows.map(toUi),
    };
  } catch (error) {
    console.error("Failed to load newsletter templates:", error);

    return {
      ok: false,
      message: "Unable to load the newsletter templates.",
    };
  }
}

export async function getTemplate(
  id: string
): Promise<Result<Template | null>> {
  const user = await requireUser();

  if (!can(user.role, "newsletters.view")) {
    return {
      ok: false,
      message: "You do not have permission to view templates.",
    };
  }

  try {
    const row = await prisma.template.findUnique({
      where: { id },
    });

    return {
      ok: true,
      data: row ? toUi(row) : null,
    };
  } catch (error) {
    console.error("Failed to load newsletter template:", error);

    return {
      ok: false,
      message: "Unable to load this newsletter template.",
    };
  }
}
