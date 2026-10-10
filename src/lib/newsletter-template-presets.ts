import {
  BLOCK_DEFINITIONS,
  blocksToText,
  parseBlocks,
  type BlockType,
  type NewsletterBlock,
} from "@/lib/newsletter-blocks";

export interface NewsletterTemplateDesign {
  version: 1;
  subjectLine: string;
  previewText: string;
  headerImageUrl: string;
  bodyText: string;
  blocks: NewsletterBlock[];
}

export interface NewsletterTemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  isPopular: boolean;
  design: NewsletterTemplateDesign;
}

function block(
  id: string,
  type: BlockType,
  fields: Record<string, string> = {}
): NewsletterBlock {
  return {
    id,
    type,
    fields: {
      ...BLOCK_DEFINITIONS[type].defaults,
      ...fields,
    },
  };
}

function footer(id: string): NewsletterBlock {
  return block(id, "footer", {
    churchName: "Glory Worship Church",
    address: "",
    notice:
      "You are receiving this because you subscribed to our church newsletter.",
    preferencesLabel: "Manage Preferences",
    unsubscribeLabel: "Unsubscribe",
    socialUrl: "",
    websiteUrl: "",
    contactUrl: "",
  });
}

function design(
  subjectLine: string,
  previewText: string,
  blocks: NewsletterBlock[]
): NewsletterTemplateDesign {
  const validatedBlocks = parseBlocks(blocks);

  return {
    version: 1,
    subjectLine,
    previewText,
    headerImageUrl: "",
    bodyText: blocksToText(validatedBlocks),
    blocks: validatedBlocks,
  };
}

export const NEWSLETTER_TEMPLATE_PRESETS: NewsletterTemplatePreset[] = [
  {
    id: "gwc-preset-weekly-bulletin-v1",
    name: "Weekly Bulletin",
    description:
      "A Sunday bulletin with a personal greeting, church news, scripture, giving, and a closing invitation.",
    category: "General",
    isPopular: true,
    design: design(
      "Sunday Bulletin",
      "Your weekly church news, encouragement, and opportunities to connect.",
      [
        block("weekly-greeting", "greeting", {
          text: "Hi {{memberName}},",
        }),

        block("weekly-introduction", "text", {
          heading: "You're invited!",
          body:
            "Join us for worship, prayer, and an encounter with God.\n" +
            "Come expecting an atmosphere of worship, powerful ministry, " +
            "and an opportunity to connect with the church family.",
        }),

        block("weekly-scripture", "scripture", {
          verse:
            "Now the Lord is that Spirit: and where the Spirit of the Lord is, there is liberty.",
          reference: "2 Corinthians 3:17",
        }),

        block("weekly-giving", "giving", {
          title: "Tithe & Kingdom Giving",
          description:
            "Support local outreach, global missions, and our sanctuary maintenance.",
          buttonLabel: "Give Securely Online",
          url: "",
        }),

        block("weekly-invitation", "text", {
          heading: "",
          body:
            "We would love to have you with us. Come with your family, " +
            "invite a friend, and let's worship together.",
        }),

        block("weekly-register", "button", {
          label: "Register Now",
          url: "",
        }),

        block("weekly-closing", "text", {
          heading: "We can't wait to see you there!",
          body: "With love, Glory Worship Church",
        }),

        footer("weekly-footer"),
      ]
    ),
  },

  {
    id: "gwc-preset-event-announcement-v1",
    name: "Event Announcement",
    description:
      "Invite your church family to a special gathering with event details and a clear registration button.",
    category: "Events",
    isPopular: false,
    design: design(
      "You're Invited: Worship & Fellowship",
      "Join your church family for a special gathering.",
      [
        block("event-greeting", "greeting", {
          text: "Hi {{memberName}},",
        }),

        block("event-introduction", "text", {
          heading: "Make plans to join us",
          body:
            "We are coming together for a special time of worship, " +
            "encouragement, and fellowship. Invite someone to come with you.",
        }),

        block("event-scripture", "scripture", {
          verse:
            "For where two or three are gathered together in my name, there am I in the midst of them.",
          reference: "Matthew 18:20",
        }),

        block("event-details", "event", {
          title: "Worship & Fellowship Gathering",
          date: "Add the event date and time",
          location: "Add the event location",
          description:
            "Share what guests can expect, who the event is for, " +
            "and any important information before they arrive.",
        }),

        block("event-register", "button", {
          label: "Register Now",
          url: "",
        }),

        block("event-closing", "text", {
          heading: "There is a place for you",
          body: "Bring your family and invite a friend. We look forward to welcoming you.",
        }),

        footer("event-footer"),
      ]
    ),
  },

  {
    id: "gwc-preset-ministry-update-v1",
    name: "Ministry Update",
    description:
      "Share ministry highlights, upcoming activities, and opportunities to serve.",
    category: "Ministry",
    isPopular: false,
    design: design(
      "Ministry News & Opportunities",
      "See what is happening in our church community and how you can get involved.",
      [
        block("ministry-greeting", "greeting", {
          text: "Hi {{memberName}},",
        }),

        block("ministry-introduction", "text", {
          heading: "Growing together, serving together",
          body:
            "Thank you for being part of our church family. " +
            "Here are this month's ministry highlights and opportunities to get involved.",
        }),

        block("ministry-scripture", "scripture", {
          verse:
            "As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God.",
          reference: "1 Peter 4:10",
        }),

        block("ministry-highlights", "text", {
          heading: "Ministry highlights",
          body:
            "Add a recent testimony, outreach update, or ministry milestone here.\n" +
            "Celebrate the people who served and the impact of their contribution.",
        }),

        block("ministry-event", "event", {
          title: "Our Next Ministry Gathering",
          date: "Add the gathering date and time",
          location: "Add the gathering location",
          description:
            "Explain how members can participate and what they should bring.",
        }),

        block("ministry-giving", "giving", {
          title: "Support the Ministry",
          description:
            "Help us continue serving our church family and local community.",
          buttonLabel: "Give Securely Online",
          url: "",
        }),

        block("ministry-volunteer", "button", {
          label: "Get Involved",
          url: "",
        }),

        block("ministry-closing", "text", {
          heading: "Your contribution matters",
          body: "Thank you for your prayers, generosity, and willingness to serve.",
        }),

        footer("ministry-footer"),
      ]
    ),
  },
];

export function parseTemplateDesign(
  value: unknown
): NewsletterTemplateDesign | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;

  if (
    source.version !== 1 ||
    typeof source.subjectLine !== "string" ||
    typeof source.previewText !== "string" ||
    typeof source.headerImageUrl !== "string"
  ) {
    return null;
  }

  try {
    const blocks = parseBlocks(source.blocks);

    return {
      version: 1,
      subjectLine: source.subjectLine,
      previewText: source.previewText,
      headerImageUrl: source.headerImageUrl,
      bodyText: blocksToText(blocks),
      blocks,
    };
  } catch {
    return null;
  }
}
