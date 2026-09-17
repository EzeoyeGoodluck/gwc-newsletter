import { NextRequest, NextResponse } from "next/server";

interface Campaign {
  id: string;
  title: string;
  campaignId: string;
  status: "draft" | "scheduled" | "sent";
  category: string;
  lastEdited: string;
}

const ALL_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    title: "Easter Sunday Preparations",
    campaignId: "CMP-2024-04-A",
    status: "draft",
    category: "General",
    lastEdited: "Today, 9:45 AM",
  },
  {
    id: "2",
    title: "Youth Ministry Summer Retreat",
    campaignId: "CMP-2024-04-B",
    status: "scheduled",
    category: "Students",
    lastEdited: "Yesterday, 4:20 PM",
  },
  {
    id: "3",
    title: "Volunteer Schedule - Q2 Updates",
    campaignId: "CMP-2024-03-Z",
    status: "sent",
    category: "Workers",
    lastEdited: "Mar 28, 2024",
  },
  {
    id: "4",
    title: "Weekly Bulletin - April Week 2",
    campaignId: "CMP-2024-04-C",
    status: "sent",
    category: "General",
    lastEdited: "Apr 8, 2024",
  },
  {
    id: "5",
    title: "Mission Trip Fundraiser Update",
    campaignId: "CMP-2024-03-Y",
    status: "sent",
    category: "General",
    lastEdited: "Mar 22, 2024",
  },
  {
    id: "6",
    title: "New Members Welcome Letter",
    campaignId: "CMP-2024-04-D",
    status: "draft",
    category: "General",
    lastEdited: "2 days ago",
  },
  {
    id: "7",
    title: "Choir Rehearsal Schedule Change",
    campaignId: "CMP-2024-04-E",
    status: "scheduled",
    category: "Workers",
    lastEdited: "3 days ago",
  },
  {
    id: "8",
    title: "Community Outreach Signup",
    campaignId: "CMP-2024-03-X",
    status: "sent",
    category: "General",
    lastEdited: "Mar 15, 2024",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const categories =
    searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = 3;

  let filtered = ALL_CAMPAIGNS;

  if (status && status !== "all") {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (categories.length > 0) {
    filtered = filtered.filter((c) => categories.includes(c.category));
  }
  if (search) {
    filtered = filtered.filter((c) => c.title.toLowerCase().includes(search));
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    campaigns: paged.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      category: c.category,
      lastEdited: c.lastEdited,
    })),
    total,
    page,
    pageSize,
  });
}
