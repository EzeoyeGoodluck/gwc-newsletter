"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

import type { Member } from "@/components/members/members-directory";
import type { Category } from "@/components/members/create-category-modal";

type Result<T = undefined> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
    };

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

  // Church membership status, not email subscription consent.
  status: string;

  joinDate: string;
  renewalDate: string;
  categories: string[];
  notes: string;
};

export type MemberProfileData = MemberFormData & {
  subscriptionStatus:
    | "SUBSCRIBED"
    | "UNSUBSCRIBED"
    | "BOUNCED";

  unsubscribedAt: string | null;
};

const memberInclude = {
  groups: {
    include: {
      group: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.MemberInclude;

type MemberWithGroups = Prisma.MemberGetPayload<{
  include: typeof memberInclude;
}>;

function formatMemberId(number: number) {
  return `#GW-${String(number).padStart(4, "0")}`;
}

function normalizeMembershipStatus(
  value: string
): Member["status"] {
  const normalized = value.trim().toLowerCase();

  if (normalized === "inactive") return "inactive";
  if (normalized === "visitor") return "visitor";

  return "active";
}

function toUi(member: MemberWithGroups): Member {
  const membershipStatus = normalizeMembershipStatus(
    member.membershipStatus
  );

  return {
    id: member.id,
    memberId: formatMemberId(member.memberNumber),
    name: member.name,
    email: member.email,
    phone: member.phone ?? undefined,
    categories: member.groups.map(
      (membership) => membership.group.name
    ),

    // Directory display rule:
    // unsubscribed members always appear as inactive.
    status:
      member.status === "UNSUBSCRIBED"
        ? "inactive"
        : membershipStatus,
  };
}

function toDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function isDuplicate(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function isValidEmail(value: string) {
  return (
    value.length <= 254 &&
    /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value)
  );
}

async function groupIdsFor(names: string[] = []) {
  const cleaned = Array.from(
    new Set(
      names
        .map((name) => name.trim())
        .filter(Boolean)
    )
  );

  if (cleaned.length === 0) return [];

  const groups = await Promise.all(
    cleaned.map((name) =>
      prisma.group.upsert({
        where: {
          name,
        },
        update: {},
        create: {
          name,
        },
        select: {
          id: true,
        },
      })
    )
  );

  return groups.map((group) => ({
    groupId: group.id,
  }));
}

export async function listMembers(input: {
  page: number;
  pageSize: number;
  status: string;
  category: string;
}): Promise<
  Result<{
    members: Member[];
    total: number;
  }>
> {
  await requirePermission("members.view");

  const pageSize = Number.isSafeInteger(input.pageSize)
    ? Math.min(Math.max(input.pageSize, 1), 50)
    : 10;

  const page = Number.isSafeInteger(input.page)
    ? Math.max(input.page, 1)
    : 1;

  const statusFilter = input.status.trim().toLowerCase();
  const categoryFilter = input.category.trim();

  const conditions: Prisma.MemberWhereInput[] = [];

  if (statusFilter === "inactive") {
    conditions.push({
      OR: [
        {
          membershipStatus: "inactive",
        },
        {
          status: "UNSUBSCRIBED",
        },
      ],
    });
  } else if (statusFilter === "visitor") {
    conditions.push({
      membershipStatus: "visitor",
      status: {
        not: "UNSUBSCRIBED",
      },
    });
  } else if (statusFilter === "active") {
    conditions.push({
      membershipStatus: {
        notIn: ["inactive", "visitor"],
      },
      status: {
        not: "UNSUBSCRIBED",
      },
    });
  }

  if (
    categoryFilter &&
    categoryFilter !== "All Categories"
  ) {
    conditions.push({
      groups: {
        some: {
          group: {
            name: categoryFilter,
          },
        },
      },
    });
  }

  const where: Prisma.MemberWhereInput =
    conditions.length > 0
      ? {
          AND: conditions,
        }
      : {};

  const [total, rows] = await prisma.$transaction([
    prisma.member.count({
      where,
    }),

    prisma.member.findMany({
      where,
      include: memberInclude,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    ok: true,
    data: {
      members: rows.map(toUi),
      total,
    },
  };
}

export async function listCategories(): Promise<
  Result<Category[]>
> {
  await requirePermission("members.view");

  const groups = await prisma.group.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return {
    ok: true,
    data: groups.map((group) => ({
      name: group.name,
      description: group.description ?? "",
    })),
  };
}

export async function getMemberProfile(
  id: string
): Promise<Result<MemberProfileData>> {
  await requirePermission("members.view");

  const memberId = id.trim();

  if (!memberId) {
    return {
      ok: false,
      message: "A member ID is required.",
    };
  }

  const member = await prisma.member.findUnique({
    where: {
      id: memberId,
    },
    include: memberInclude,
  });

  if (!member) {
    return {
      ok: false,
      message: "This member no longer exists.",
    };
  }

  const membershipStatus = normalizeMembershipStatus(
    member.membershipStatus
  );

  return {
    ok: true,
    data: {
      fullName: member.name,
      email: member.email,
      phone: member.phone ?? "",
      dateOfBirth: toDateInput(member.dateOfBirth),
      gender: member.gender ?? "",
      streetAddress: member.streetAddress ?? "",
      city: member.city ?? "",
      state: member.state ?? "",
      postalCode: member.postalCode ?? "",
      country: member.country ?? "",
      membershipType:
        member.membershipType ?? "Regular Member",

      // Preserve the actual church membership in the form.
      // The table's inactive override is applied only in toUi().
      status:
        membershipStatus.charAt(0).toUpperCase() +
        membershipStatus.slice(1),

      joinDate: toDateInput(member.joinDate),
      renewalDate: toDateInput(member.renewalDate),
      categories: member.groups.map(
        (membership) => membership.group.name
      ),
      notes: member.notes ?? "",

      // Separate, read-only subscription metadata.
      subscriptionStatus: member.status,
      unsubscribedAt:
        member.unsubscribedAt?.toISOString() ?? null,
    },
  };
}

export async function createMember(
  input: Omit<Member, "id" | "memberId">
): Promise<Result<Member>> {
  await requirePermission("members.manage");

  const name = input.name.trim();
  const emailAddress = input.email.trim().toLowerCase();

  if (!name || !isValidEmail(emailAddress)) {
    return {
      ok: false,
      message:
        "Please enter a name and a valid email address.",
    };
  }

  const membershipStatus = normalizeMembershipStatus(
    input.status ?? "active"
  );

  try {
    const existing = await prisma.member.findUnique({
      where: {
        email: emailAddress,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return {
        ok: false,
        message: "A member with this email already exists.",
      };
    }

    const groups = await groupIdsFor(input.categories);

    const max = await prisma.member.aggregate({
      _max: {
        memberNumber: true,
      },
    });

    const created = await prisma.member.create({
      data: {
        memberNumber:
          (max._max.memberNumber ?? 1000) + 1,
        name,
        email: emailAddress,
        phone: input.phone?.trim() || null,
        membershipStatus,
        joinDate: new Date(),
        source: "staff",
        groups: {
          create: groups,
        },

        // Preserve the existing database default for
        // the email subscription on new member records.
      },
      include: memberInclude,
    });

    return {
      ok: true,
      data: toUi(created),
    };
  } catch (error) {
    if (isDuplicate(error)) {
      return {
        ok: false,
        message:
          "The email address or generated member number is already in use. Refresh the member list before trying again.",
      };
    }

    console.error("Failed to create member:", error);

    return {
      ok: false,
      message:
        "The member could not be created. Check the member list before trying again.",
    };
  }
}

export async function updateMember(
  id: string,
  form: Partial<MemberFormData>
): Promise<Result> {
  await requirePermission("members.manage");

  const memberId = id.trim();

  if (!memberId) {
    return {
      ok: false,
      message: "A member ID is required.",
    };
  }

  if (
    form.fullName !== undefined &&
    !form.fullName.trim()
  ) {
    return {
      ok: false,
      message: "Please enter the member's name.",
    };
  }

  if (
    form.email !== undefined &&
    !isValidEmail(form.email.trim())
  ) {
    return {
      ok: false,
      message: "Please enter a valid email address.",
    };
  }

  const data: Prisma.MemberUpdateInput = {};

  if (form.fullName !== undefined) {
    data.name = form.fullName.trim();
  }

  if (form.email !== undefined) {
    data.email = form.email.trim().toLowerCase();
  }

  if (form.phone !== undefined) {
    data.phone = form.phone.trim() || null;
  }

  if (form.status !== undefined) {
    data.membershipStatus = normalizeMembershipStatus(
      form.status
    );
  }

  if (form.membershipType !== undefined) {
    data.membershipType = form.membershipType || null;
  }

  if (form.gender !== undefined) {
    data.gender = form.gender || null;
  }

  if (form.dateOfBirth !== undefined) {
    data.dateOfBirth = toDate(form.dateOfBirth);
  }

  if (form.streetAddress !== undefined) {
    data.streetAddress = form.streetAddress || null;
  }

  if (form.city !== undefined) {
    data.city = form.city || null;
  }

  if (form.state !== undefined) {
    data.state = form.state || null;
  }

  if (form.postalCode !== undefined) {
    data.postalCode = form.postalCode || null;
  }

  if (form.country !== undefined) {
    data.country = form.country || null;
  }

  if (form.joinDate !== undefined) {
    data.joinDate = toDate(form.joinDate);
  }

  if (form.renewalDate !== undefined) {
    data.renewalDate = toDate(form.renewalDate);
  }

  if (form.notes !== undefined) {
    data.notes = form.notes || null;
  }

  try {
    if (form.categories !== undefined) {
      data.groups = {
        deleteMany: {},
        create: await groupIdsFor(form.categories),
      };
    }

    // Do not update Member.status or unsubscribedAt here.
    // Editing membership details must not resubscribe someone.
    await prisma.member.update({
      where: {
        id: memberId,
      },
      data,
    });

    return {
      ok: true,
      data: undefined,
    };
  } catch (error) {
    if (isDuplicate(error)) {
      return {
        ok: false,
        message:
          "Another member already uses this email.",
      };
    }

    if (isNotFound(error)) {
      return {
        ok: false,
        message: "This member no longer exists.",
      };
    }

    console.error("Failed to update member:", error);

    return {
      ok: false,
      message:
        "The update could not be confirmed. Reload the member record before trying again.",
    };
  }
}

export async function removeMember(
  id: string
): Promise<Result> {
  await requirePermission("members.manage");

  const memberId = id.trim();

  if (!memberId) {
    return {
      ok: false,
      message: "A member ID is required.",
    };
  }

  try {
    await prisma.member.delete({
      where: {
        id: memberId,
      },
    });

    return {
      ok: true,
      data: undefined,
    };
  } catch (error) {
    if (isNotFound(error)) {
      return {
        ok: false,
        message: "This member no longer exists.",
      };
    }

    console.error("Failed to remove member:", error);

    return {
      ok: false,
      message:
        "The removal could not be confirmed. Refresh the member list before trying again.",
    };
  }
}

export async function createCategory(
  category: Category
): Promise<Result> {
  await requirePermission("members.manage");

  const name = category.name.trim();

  if (!name) {
    return {
      ok: false,
      message: "Please enter a category name.",
    };
  }

  try {
    await prisma.group.create({
      data: {
        name,
        description: category.description || null,
      },
    });

    return {
      ok: true,
      data: undefined,
    };
  } catch (error) {
    if (isDuplicate(error)) {
      return {
        ok: false,
        message:
          "A category with this name already exists.",
      };
    }

    console.error("Failed to create category:", error);

    return {
      ok: false,
      message:
        "The category could not be created. Refresh the category list before trying again.",
    };
  }
}