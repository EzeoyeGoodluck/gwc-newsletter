"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import type { Member } from "@/components/members/members-directory";
import type { Category } from "@/components/members/create-category-modal";
import { input, email } from "zod";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type MemberFormData = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  membershipType: string;
  status: string;
  joinDate: string;
  renewalDate: string;
  categories: string[];
  notes: string;
};

const memberInclude = {
  groups: { include: { group: { select: { name: true } } } },
} satisfies Prisma.MemberInclude;

type MemberWithGroups = Prisma.MemberGetPayload<{
  include: typeof memberInclude;
}>;

function formatMemberId(n: number) {
  return `#GW-${String(n).padStart(4, "0")}`;
}

function toUi(m: MemberWithGroups): Member {
  return {
    id: m.id,
    memberId: formatMemberId(m.memberNumber),
    name: m.name,
    email: m.email,
    phone: m.phone ?? undefined,
    categories: m.groups.map((g) => g.group.name),
    status: m.membershipStatus as Member["status"],
  };
}

function toDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function toDateInput(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "";
}

function isDuplicate(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function groupIdsFor(names: string[] = []) {
  const cleaned = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (cleaned.length === 0) return [];

  const groups = await Promise.all(
    cleaned.map((name) =>
      prisma.group.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true },
      })
    )
  );

  return groups.map((g) => ({ groupId: g.id }));
}

export async function listMembers(input: {
  page: number;
  pageSize: number;
  status: string;
  category: string;
}): Promise<Result<{ members: Member[]; total: number }>> {
  await requirePermission("members.view");

  const pageSize = Math.min(Math.max(input.pageSize, 1), 50);
  const page = Math.max(input.page, 1);
  const where: Prisma.MemberWhereInput = {};

  if (input.status && input.status !== "All Members") {
    where.membershipStatus = input.status.toLowerCase();
  }
  if (input.category && input.category !== "All Categories") {
    where.groups = { some: { group: { name: input.category } } };
  }

  const [total, rows] = await prisma.$transaction([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      include: memberInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { ok: true, data: { members: rows.map(toUi), total } };
}

export async function listCategories(): Promise<Result<Category[]>> {
  await requirePermission("members.view");
  const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
  return {
    ok: true,
    data: groups.map((g) => ({
      name: g.name,
      description: g.description ?? "",
    })),
  };
}

export async function getMemberProfile(
  id: string
): Promise<Result<MemberFormData>> {
  await requirePermission("members.view");
  const m = await prisma.member.findUnique({
    where: { id },
    include: memberInclude,
  });
  if (!m) return { ok: false, message: "This member no longer exists." };

  return {
    ok: true,
    data: {
      fullName: m.name,
      email: m.email,
      phone: m.phone ?? "",
      dateOfBirth: toDateInput(m.dateOfBirth),
      gender: m.gender ?? "",
      streetAddress: m.streetAddress ?? "",
      city: m.city ?? "",
      state: m.state ?? "",
      postalCode: m.postalCode ?? "",
      country: m.country ?? "",
      membershipType: m.membershipType ?? "Regular Member",
      status:
        m.membershipStatus.charAt(0).toUpperCase() +
        m.membershipStatus.slice(1),
      joinDate: toDateInput(m.joinDate),
      renewalDate: toDateInput(m.renewalDate),
      categories: m.groups.map((g) => g.group.name),
      notes: m.notes ?? "",
    },
  };
}

export async function createMember(
  input: Omit<Member, "id" | "memberId">
): Promise<Result<Member>> {
  console.log("createMember input:", JSON.stringify(input));
  await requirePermission("members.manage");

  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email.includes("@")) {
    return {
      ok: false,
      message: "Please enter a name and a valid email address.",
    };
  }

  const groups = await groupIdsFor(input.categories);
  const max = await prisma.member.aggregate({ _max: { memberNumber: true } });

  try {
    const created = await prisma.member.create({
      data: {
        memberNumber: (max._max.memberNumber ?? 1000) + 1,
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || null,
        membershipStatus: (input.status ?? "active").toLowerCase(),
        joinDate: new Date(),
        source: "staff",
        groups: { create: groups },
      },
      include: memberInclude,
    });
    return { ok: true, data: toUi(created) };
  } catch (error) {
    if (isDuplicate(error))
      return { ok: false, message: "A member with this email already exists." };
    throw error;
  }
}

export async function updateMember(
  id: string,
  form: Partial<MemberFormData>
): Promise<Result> {
  await requirePermission("members.manage");

  const data: Prisma.MemberUpdateInput = {};
  if (form.fullName !== undefined) data.name = form.fullName.trim();
  if (form.email !== undefined) data.email = form.email.trim().toLowerCase();
  if (form.phone !== undefined) data.phone = form.phone.trim() || null;
  if (form.status !== undefined)
    data.membershipStatus = form.status.toLowerCase();
  if (form.membershipType !== undefined)
    data.membershipType = form.membershipType || null;
  if (form.gender !== undefined) data.gender = form.gender || null;
  if (form.dateOfBirth !== undefined)
    data.dateOfBirth = toDate(form.dateOfBirth);
  if (form.streetAddress !== undefined)
    data.streetAddress = form.streetAddress || null;
  if (form.city !== undefined) data.city = form.city || null;
  if (form.state !== undefined) data.state = form.state || null;
  if (form.postalCode !== undefined) data.postalCode = form.postalCode || null;
  if (form.country !== undefined) data.country = form.country || null;
  if (form.joinDate !== undefined) data.joinDate = toDate(form.joinDate);
  if (form.renewalDate !== undefined)
    data.renewalDate = toDate(form.renewalDate);
  if (form.notes !== undefined) data.notes = form.notes || null;
  if (form.categories !== undefined) {
    data.groups = {
      deleteMany: {},
      create: await groupIdsFor(form.categories),
    };
  }

  try {
    await prisma.member.update({ where: { id }, data });
    return { ok: true, data: undefined };
  } catch (error) {
    if (isDuplicate(error))
      return { ok: false, message: "Another member already uses this email." };
    throw error;
  }
}

export async function removeMember(id: string): Promise<Result> {
  await requirePermission("members.manage");
  await prisma.member.delete({ where: { id } });
  return { ok: true, data: undefined };
}

export async function createCategory(category: Category): Promise<Result> {
  await requirePermission("members.manage");
  const name = category.name.trim();
  if (!name) return { ok: false, message: "Please enter a category name." };

  try {
    await prisma.group.create({
      data: { name, description: category.description || null },
    });
    return { ok: true, data: undefined };
  } catch (error) {
    if (isDuplicate(error))
      return {
        ok: false,
        message: "A category with this name already exists.",
      };
    throw error;
  }
}
