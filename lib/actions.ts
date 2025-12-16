"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { actionInitialState, type ActionState } from "./actionState";
import {
  getPostById,
  insertComment,
  insertPost,
  PostType,
  updatePostById,
  updatePostImages,
} from "./data";
import {
  updateAboutBio,
  updateAvatarUrl,
  updateAvatarPosition,
  addContactLink,
  addMilestone,
  deleteContactLink,
  deleteMilestone,
  updateNavEyebrow,
  updateNavTitle,
  updateHeroEyebrow,
  updateHeroTitle,
  updateHomeIntroduction,
  updateContactLink,
  updateMilestone,
  updateGalleryText,
  updateAdminNotes,
} from "./siteContent";

function readFormValue(formData: FormData, field: string = "value"): string {
  return String(formData.get(field) ?? "").trim();
}

export async function createPost(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim() as PostType;
  const content = String(formData.get("content") ?? "").trim();
  const imageField = String(formData.get("images") ?? "");

  if (!title || !content || !["diary", "photo", "article"].includes(type)) {
    return { ...actionInitialState, message: "Please complete all required fields." };
  }

  const images =
    type === "photo"
      ? imageField
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

  await insertPost({
    title,
    type,
    content,
    images,
  });

  revalidatePath("/");
  revalidatePath("/diary");
  revalidatePath("/gallery");
  revalidatePath("/photos");

  return { success: true, message: "Post created." };
}

export async function createDiaryEntry(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const cover = await readImageFromForm(formData.get("cover"));

  if (!title || !content) {
    return errorMessage("Please provide both a title and body for the diary entry.");
  }

  await insertPost({
    title,
    type: "diary",
    content,
    images: cover ? [cover] : [],
  });

  revalidatePath("/");
  revalidatePath("/diary");
  return successMessage("Diary entry added to the timeline.");
}

export async function createPhotoSet(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const imageUrlsRaw = String(formData.get("imageUrls") ?? "[]");
  let images: string[] = [];

  try {
    const parsed = JSON.parse(imageUrlsRaw);
    if (Array.isArray(parsed)) {
      images = parsed.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
    }
  } catch {
    images = [];
  }

  if (images.length === 0) {
    return errorMessage("Add at least one image for the gallery entry.");
  }

  const now = new Date();
  const fallbackTitle = `Gallery upload ${now.toLocaleDateString()}`;
  const fallbackDescription = `Imported ${images.length} new ${images.length > 1 ? "frames" : "frame"}.`;

  await insertPost({
    title: fallbackTitle,
    type: "photo",
    content: fallbackDescription,
    images,
  });

  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/photos");
  return successMessage("Photo gallery updated.");
}

async function readImageFromForm(value: FormDataEntryValue | null): Promise<string | null> {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  const mimeType = value.type || "image/png";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function readImagesFromForm(entries: FormDataEntryValue[]): Promise<string[]> {
  const results = await Promise.all(entries.map((entry) => readImageFromForm(entry)));
  return results.filter((src): src is string => Boolean(src));
}

export async function addComment(
  postId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();

  if (!name || !text) {
    return { ...actionInitialState, message: "Please add your name and a comment." };
  }

  await insertComment(postId, { name, text });
  revalidatePath(`/post/${postId}`);

  return { success: true, message: "Thanks for leaving a note!" };
}

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "atelier-edit";

export async function enableEditMode(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const code = String(formData.get("passcode") ?? "").trim();

  if (code !== ADMIN_PASSCODE) {
    return {
      success: false,
      message: "Incorrect passcode. Please try again.",
    };
  }

  cookies().set("edit-mode", "true", {
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return { success: true, message: "Edit mode enabled for this browser." };
}

export async function disableEditMode(): Promise<ActionState> {
  cookies().delete("edit-mode");
  return { success: true, message: "Edit mode disabled." };
}

function successMessage(message: string): ActionState {
  return { success: true, message };
}

function errorMessage(message: string): ActionState {
  return { success: false, message };
}

export async function saveHomeIntro(formData: FormData) {
  const intro = readFormValue(formData);
  if (!intro) {
    return errorMessage("Introduction cannot be empty.");
  }

  await updateHomeIntroduction(intro);
  revalidatePath("/");
  return successMessage("Home introduction updated.");
}

export async function saveHeroEyebrow(formData: FormData) {
  const next = readFormValue(formData);
  if (!next) {
    return errorMessage("Eyebrow cannot be empty.");
  }
  await updateHeroEyebrow(next);
  revalidatePath("/");
  return successMessage("Hero eyebrow updated.");
}

export async function saveHeroTitle(formData: FormData) {
  const next = readFormValue(formData);
  if (!next) {
    return errorMessage("Title cannot be empty.");
  }
  await updateHeroTitle(next);
  revalidatePath("/");
  return successMessage("Hero title updated.");
}

export async function saveNavEyebrow(formData: FormData) {
  const next = readFormValue(formData);
  if (!next) {
    return errorMessage("Eyebrow cannot be empty.");
  }
  await updateNavEyebrow(next);
  revalidatePath("/");
  return successMessage("Nav eyebrow updated.");
}

export async function saveNavTitle(formData: FormData) {
  const next = readFormValue(formData);
  if (!next) {
    return errorMessage("Title cannot be empty.");
  }
  await updateNavTitle(next);
  revalidatePath("/");
  return successMessage("Nav title updated.");
}

export async function saveAvatarUrl(formData: FormData) {
  const url = readFormValue(formData);
  if (!url) {
    return errorMessage("Please provide an image URL.");
  }

  await updateAvatarUrl(url);
  revalidatePath("/");
  revalidatePath("/about");
  return successMessage("Avatar updated.");
}

export async function saveAvatarPosition(formData: FormData) {
  const position = readFormValue(formData);
  if (!position) {
    return errorMessage("Please choose an alignment.");
  }
  await updateAvatarPosition(position);
  revalidatePath("/");
  revalidatePath("/about");
  return successMessage("Avatar positioning updated.");
}

export async function saveAboutBio(formData: FormData) {
  const bio = readFormValue(formData);
  if (!bio) {
    return errorMessage("Bio cannot be empty.");
  }

  await updateAboutBio(bio);
  revalidatePath("/about");
  return successMessage("Bio updated.");
}

export async function saveMilestoneYear(milestoneId: string, formData: FormData) {
  const sanitized = readFormValue(formData);
  if (!sanitized) {
    return errorMessage("Year cannot be empty.");
  }

  await updateMilestone(milestoneId, { year: sanitized });
  revalidatePath("/about");
  return successMessage("Year updated.");
}

export async function saveMilestoneDescription(
  milestoneId: string,
  formData: FormData,
) {
  const sanitized = readFormValue(formData);
  if (!sanitized) {
    return errorMessage("Description cannot be empty.");
  }

  await updateMilestone(milestoneId, { description: sanitized });
  revalidatePath("/about");
  return successMessage("Milestone updated.");
}

export async function addMilestoneAction(afterId?: string) {
  await addMilestone("New year", "New milestone", afterId);
  revalidatePath("/about");
  return successMessage("Milestone added.");
}

export async function deleteMilestoneAction(id: string) {
  await deleteMilestone(id);
  revalidatePath("/about");
  return successMessage("Milestone removed.");
}

export async function addContactLinkAction() {
  await addContactLink();
  revalidatePath("/about");
  return successMessage("Contact link added.");
}

export async function updateContactLinkAction(
  linkId: string,
  payload: { label?: string; value?: string; href?: string; icon?: string },
) {
  await updateContactLink(linkId, payload);
  revalidatePath("/about");
  return successMessage("Contact link updated.");
}

export async function deleteContactLinkAction(linkId: string) {
  await deleteContactLink(linkId);
  revalidatePath("/about");
  return successMessage("Contact link removed.");
}

export async function updateGalleryTextAction(
  field: "eyebrow" | "title" | "description",
  formData: FormData,
) {
  const value = readFormValue(formData);
  await updateGalleryText({ [field]: value });
  revalidatePath("/gallery");
  revalidatePath("/photos");
  return successMessage("Gallery text updated.");
}

export async function updateAdminNotesAction(notes: string[]) {
  await updateAdminNotes(notes);
  revalidatePath("/admin");
  return successMessage("Notes updated.");
}

export async function updateDiaryContent(postId: string, content: string) {
  const text = content.trim();
  const post = await getPostById(postId);

  if (!post || post.type !== "diary") {
    return errorMessage("Diary entry not found.");
  }

  if (!text) {
    return errorMessage("Content cannot be empty.");
  }

  await updatePostById(postId, { content: text });
  revalidatePath("/diary");
  revalidatePath("/");
  return successMessage("Diary entry updated.");
}

export async function updateDiaryCover(postId: string, imageUrl: string) {
  const post = await getPostById(postId);
  if (!post || post.type !== "diary") {
    return errorMessage("Diary entry not found.");
  }

  const formatted = imageUrl.trim();
  const nextImages =
    formatted.length > 0 ? [formatted, ...post.images.slice(1)] : post.images.slice(1);

  await updatePostImages(postId, nextImages);
  revalidatePath("/diary");
  revalidatePath("/");
  return successMessage("Cover updated.");
}

export async function updateGalleryImage(postId: string, index: number, imageUrl: string) {
  const post = await getPostById(postId);
  if (!post || post.type !== "photo") {
    return errorMessage("Gallery post not found.");
  }

  if (index < 0 || index >= post.images.length) {
    return errorMessage("Image slot not available.");
  }

  const sanitized = imageUrl.trim();

  const next =
    sanitized.length === 0
      ? post.images.filter((_, i) => i !== index)
      : post.images.map((img, i) => (i === index ? sanitized : img));

  await updatePostImages(postId, next);
  revalidatePath("/gallery");
  revalidatePath("/photos");
  revalidatePath(`/post/${postId}`);
  return successMessage("Gallery image updated.");
}

export async function setThemeAction(theme: "classic" | "beast") {
  cookies().set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
  return { success: true, message: `Theme set to ${theme}` } as ActionState;
}
