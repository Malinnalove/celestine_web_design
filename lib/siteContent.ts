import { randomUUID } from "crypto";
import client from "./db";

export type Milestone = {
  id: string;
  year: string;
  description: string;
};

export type ContactLink = {
  id: string;
  label: string;
  value: string;
  href: string;
  icon?: string;
};

export type SiteContent = {
  navEyebrow: string;
  navTitle: string;
  heroEyebrow: string;
  heroTitle: string;
  avatarUrl: string;
  avatarPosition: string;
  homeIntroduction: string;
  aboutBio: string;
  milestones: Milestone[];
  contactLinks: ContactLink[];
  galleryEyebrow: string;
  galleryTitle: string;
  galleryDescription: string;
  adminNotes: string[];
};

const DEFAULT_CONTENT: SiteContent = {
  heroEyebrow: "Editorial dispatch",
  heroTitle: "Everyday field notes & gallery fragments",
  navEyebrow: "Journal of",
  navTitle: "Studio Notes",
  avatarUrl:
    "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80",
  avatarPosition: "center",
  homeIntroduction:
    "A living archive of quiet mornings, impromptu journeys, and the slow rituals that stitch days together. Pull up a chair and linger for a while—each entry is an invitation to breathe.",
  aboutBio:
    "I'm Jules, a writer-photographer who collects stories from ordinary days. My studio drifts between notebooks, cameras, and long walks.",
  milestones: [
    {
      id: "milestone-2015",
      year: "2015",
      description: "Moved to the coast and began documenting the tides every dawn.",
    },
    {
      id: "milestone-2019",
      year: "2019",
      description: "Published the 'Quiet Hours' photo zine and hosted a small gallery show.",
    },
    {
      id: "milestone-2023",
      year: "2023",
      description: "Launched this hybrid diary to weave essays, field notes, and visual studies.",
    },
  ],
  contactLinks: [
    { id: "contact-email", label: "Email", value: "studio@quietfield.com", href: "mailto:studio@quietfield.com", icon: "✉️" },
    { id: "contact-instagram", label: "Instagram", value: "@studio.notes", href: "https://www.instagram.com/studio.notes", icon: "📸" },
    { id: "contact-newsletter", label: "Newsletter", value: "Field Notes dispatch", href: "https://example.com/newsletter", icon: "📰" },
    { id: "contact-shop", label: "Print shop", value: "Limited zines & prints", href: "https://example.com/shop", icon: "🛒" },
  ],
  galleryEyebrow: "Gallery Grid",
  galleryTitle: "Observations in three or four columns",
  galleryDescription:
    "Tap a tile to see it fullscreen. In edit mode every tile unlocks inline controls so you can swap an image without leaving the flow.",
  adminNotes: [
    "Inline editing map: Home intro, Diary timeline, Gallery images, About bio/links",
    "Reminders: add new diary entry this weekend",
  ],
};

const KEY_AVATAR_URL = "avatarUrl";
const KEY_AVATAR_POSITION = "avatarPosition";
const KEY_HOME_INTRO = "homeIntroduction";
const KEY_ABOUT_BIO = "aboutBio";
const KEY_MILESTONES = "milestones";
const KEY_HERO_EYEBROW = "heroEyebrow";
const KEY_HERO_TITLE = "heroTitle";
const KEY_CONTACT_LINKS = "contactLinks";
const KEY_NAV_EYEBROW = "navEyebrow";
const KEY_NAV_TITLE = "navTitle";
const KEY_GALLERY_EYEBROW = "galleryEyebrow";
const KEY_GALLERY_TITLE = "galleryTitle";
const KEY_GALLERY_DESC = "galleryDescription";
const KEY_ADMIN_NOTES = "adminNotes";

async function getSetting(key: string): Promise<string | null> {
  const { rows } = await client.execute({
    sql: "select value from site_settings where key = ? limit 1",
    args: [key],
  });
  const settingRows = rows as unknown as { value: string }[];
  const row = settingRows[0];
  return row?.value ?? null;
}

async function upsertSetting(key: string, value: string) {
  await client.execute(
    "insert into site_settings (key, value) values (?, ?) on conflict(key) do update set value = excluded.value",
    [key, value],
  );
}

export async function getSiteContent(): Promise<SiteContent> {
  const [
    avatarUrl,
    avatarPosition,
    homeIntroduction,
    aboutBio,
    milestonesRaw,
    heroEyebrow,
    heroTitle,
    contactLinksRaw,
    navEyebrow,
    navTitle,
    galleryEyebrow,
    galleryTitle,
    galleryDescription,
    adminNotesRaw,
  ] = await Promise.all([
    getSetting(KEY_AVATAR_URL),
    getSetting(KEY_AVATAR_POSITION),
    getSetting(KEY_HOME_INTRO),
    getSetting(KEY_ABOUT_BIO),
    getSetting(KEY_MILESTONES),
    getSetting(KEY_HERO_EYEBROW),
    getSetting(KEY_HERO_TITLE),
    getSetting(KEY_CONTACT_LINKS),
    getSetting(KEY_NAV_EYEBROW),
    getSetting(KEY_NAV_TITLE),
    getSetting(KEY_GALLERY_EYEBROW),
    getSetting(KEY_GALLERY_TITLE),
    getSetting(KEY_GALLERY_DESC),
    getSetting(KEY_ADMIN_NOTES),
  ]);

  let milestones: Milestone[] = DEFAULT_CONTENT.milestones;
  if (milestonesRaw) {
    try {
      const parsed = JSON.parse(milestonesRaw) as Milestone[];
      milestones = parsed.map((item) => ({ ...item }));
    } catch {
      milestones = DEFAULT_CONTENT.milestones;
    }
  }

  let contactLinks: ContactLink[] = DEFAULT_CONTENT.contactLinks;
  if (contactLinksRaw) {
    try {
      const parsed = JSON.parse(contactLinksRaw) as ContactLink[];
      contactLinks = parsed.map((item) => ({ ...item }));
    } catch {
      contactLinks = DEFAULT_CONTENT.contactLinks;
    }
  }

  let adminNotes: string[] = DEFAULT_CONTENT.adminNotes;
  if (adminNotesRaw) {
    try {
      const parsed = JSON.parse(adminNotesRaw) as string[];
      adminNotes = parsed.filter((item): item is string => typeof item === "string");
    } catch {
      adminNotes = DEFAULT_CONTENT.adminNotes;
    }
  }

  return {
    navEyebrow: navEyebrow ?? DEFAULT_CONTENT.navEyebrow,
    navTitle: navTitle ?? DEFAULT_CONTENT.navTitle,
    heroEyebrow: heroEyebrow ?? DEFAULT_CONTENT.heroEyebrow,
    heroTitle: heroTitle ?? DEFAULT_CONTENT.heroTitle,
    avatarUrl: avatarUrl ?? DEFAULT_CONTENT.avatarUrl,
    avatarPosition: avatarPosition ?? DEFAULT_CONTENT.avatarPosition,
    homeIntroduction: homeIntroduction ?? DEFAULT_CONTENT.homeIntroduction,
    aboutBio: aboutBio ?? DEFAULT_CONTENT.aboutBio,
    milestones,
    contactLinks,
    galleryEyebrow: galleryEyebrow ?? DEFAULT_CONTENT.galleryEyebrow,
    galleryTitle: galleryTitle ?? DEFAULT_CONTENT.galleryTitle,
    galleryDescription: galleryDescription ?? DEFAULT_CONTENT.galleryDescription,
    adminNotes,
  };
}

export async function updateHeroEyebrow(heroEyebrow: string) {
  await upsertSetting(KEY_HERO_EYEBROW, heroEyebrow);
  return getSiteContent();
}

export async function updateHeroTitle(heroTitle: string) {
  await upsertSetting(KEY_HERO_TITLE, heroTitle);
  return getSiteContent();
}

export async function updateAvatarUrl(avatarUrl: string) {
  await upsertSetting(KEY_AVATAR_URL, avatarUrl);
  return getSiteContent();
}

export async function updateAvatarPosition(avatarPosition: string) {
  await upsertSetting(KEY_AVATAR_POSITION, avatarPosition);
  return getSiteContent();
}

export async function updateHomeIntroduction(homeIntroduction: string) {
  await upsertSetting(KEY_HOME_INTRO, homeIntroduction);
  return getSiteContent();
}

export async function updateAboutBio(aboutBio: string) {
  await upsertSetting(KEY_ABOUT_BIO, aboutBio);
  return getSiteContent();
}

export async function updateNavEyebrow(value: string) {
  await upsertSetting(KEY_NAV_EYEBROW, value);
  return getSiteContent();
}

export async function updateNavTitle(value: string) {
  await upsertSetting(KEY_NAV_TITLE, value);
  return getSiteContent();
}

export async function updateMilestone(id: string, payload: Partial<Omit<Milestone, "id">>) {
  const current = await getSiteContent();
  const nextMilestones = current.milestones.map((milestone) =>
    milestone.id === id ? { ...milestone, ...payload } : milestone,
  );

  await upsertSetting(KEY_MILESTONES, JSON.stringify(nextMilestones));
  return getSiteContent();
}

export async function addMilestone(year = "New year", description = "New milestone", insertAfterId?: string) {
  const current = await getSiteContent();
  const newMilestone = { id: randomUUID(), year, description };

  if (!insertAfterId) {
    const nextMilestones = [newMilestone, ...current.milestones];
    await upsertSetting(KEY_MILESTONES, JSON.stringify(nextMilestones));
    return getSiteContent();
  }

  const nextMilestones = current.milestones.flatMap((milestone) =>
    milestone.id === insertAfterId ? [milestone, newMilestone] : [milestone],
  );
  await upsertSetting(KEY_MILESTONES, JSON.stringify(nextMilestones));
  return getSiteContent();
}

export async function deleteMilestone(id: string) {
  const current = await getSiteContent();
  const nextMilestones = current.milestones.filter((milestone) => milestone.id !== id);
  await upsertSetting(KEY_MILESTONES, JSON.stringify(nextMilestones));
  return getSiteContent();
}

export async function addContactLink() {
  const current = await getSiteContent();
  const next = [
    ...current.contactLinks,
    { id: randomUUID(), label: "New link", value: "Label", href: "", icon: "" },
  ];
  await upsertSetting(KEY_CONTACT_LINKS, JSON.stringify(next));
  return getSiteContent();
}

export async function updateContactLink(
  linkId: string,
  payload: Partial<Omit<ContactLink, "id">>,
) {
  const current = await getSiteContent();
  const next = current.contactLinks.map((link) =>
    link.id === linkId ? { ...link, ...payload } : link,
  );
  await upsertSetting(KEY_CONTACT_LINKS, JSON.stringify(next));
  return getSiteContent();
}

export async function deleteContactLink(linkId: string) {
  const current = await getSiteContent();
  const next = current.contactLinks.filter((link) => link.id !== linkId);
  await upsertSetting(KEY_CONTACT_LINKS, JSON.stringify(next));
  return getSiteContent();
}

export async function updateGalleryText(payload: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  if (payload.eyebrow !== undefined) {
    await upsertSetting(KEY_GALLERY_EYEBROW, payload.eyebrow);
  }
  if (payload.title !== undefined) {
    await upsertSetting(KEY_GALLERY_TITLE, payload.title);
  }
  if (payload.description !== undefined) {
    await upsertSetting(KEY_GALLERY_DESC, payload.description);
  }
  return getSiteContent();
}

export async function updateAdminNotes(notes: string[]) {
  await upsertSetting(KEY_ADMIN_NOTES, JSON.stringify(notes));
  return getSiteContent();
}
