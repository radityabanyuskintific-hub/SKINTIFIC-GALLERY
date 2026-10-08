import { createClient } from "./supabase/client";
import type { ImageRow, ImageUpdate } from "./supabase/database";
import { IMAGE_TYPES, imageDimensions, PAGE_SIZE, validateFile, validateMetadata } from "./images";

export type GalleryImage = ImageRow & { url: string | null };
export type Filters = { query: string; collection: string; tag?: string; trash: boolean; sort: "newest" | "oldest" | "title" };

export async function listImages(filters: Filters, offset: number, signal?: AbortSignal) {
  const supabase = createClient();
  let query = supabase.from("gallery_images").select("*", { count: "exact" });
  query = filters.trash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (filters.tag) query = query.contains("tags", [filters.tag]);
  if (filters.collection) query = query.eq("collection", filters.collection);
  if (filters.query.trim()) query = query.textSearch("search_document", filters.query.trim(), { type: "websearch", config: "simple" });
  query = query.order(filters.sort === "title" ? "title" : "created_at", { ascending: filters.sort !== "newest" }).order("id").range(offset, offset + PAGE_SIZE - 1);
  if (signal) query = query.abortSignal(signal);
  const { data, error, count } = await query;
  if (error) throw new Error("Couldn’t load the library. Check your connection and try again.");
  if (!data.length) return { images: [], count: count ?? 0 };
  const signed = await supabase.storage.from("gallery-originals").createSignedUrls(data.map(row => row.storage_path), 3600);
  if (signed.error) throw new Error("Image previews couldn’t load. Please try again.");
  const urls = new Map(signed.data.map(item => [item.path, item.signedUrl]));
  return { images: data.map(row => ({ ...row, url: urls.get(row.storage_path) || null })), count: count ?? 0 };
}

export async function listCollections() {
  const { data, error } = await createClient().from("gallery_collections").select("name").order("name");
  if (error) throw new Error("Collections couldn’t load. Refresh the page to try again.");
  return data.map(row => row.name).filter((name): name is string => !!name);
}

export async function listTags(trash: boolean) {
  const supabase = createClient();
  const tags = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    let query = supabase.from("gallery_images").select("tags").order("id").range(offset, offset + 999);
    query = trash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
    const { data, error } = await query;
    if (error) throw new Error("Tags couldn’t load. Refresh to try again.");
    for (const row of data) for (const tag of row.tags) if (tag) tags.add(tag);
    if (data.length < 1000) break;
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export async function uploadImage(file: File, userId: string, metadata: {title: string; collection: string; tags: string[]}) {
  validateFile(file); validateMetadata(metadata.title, metadata.collection);
  const dimensions = await imageDimensions(file);
  const supabase = createClient();
  const id = crypto.randomUUID();
  const path = `${userId}/${id}.${IMAGE_TYPES[file.type]}`;
  const uploaded = await supabase.storage.from("gallery-originals").upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) throw new Error(`${file.name}: upload failed. Check your connection and team access.`);
  const saved = await supabase.from("gallery_images").insert({
    id, owner_id: userId, storage_path: path, filename: file.name, mime_type: file.type,
    bytes: file.size, ...dimensions, title: metadata.title.trim(), collection: metadata.collection.trim(), tags: metadata.tags,
  });
  if (saved.error) {
    // Storage and Postgres do not share a transaction; remove only this unindexed upload.
    const removed = await supabase.storage.from("gallery-originals").remove([path]);
    throw new Error(removed.error
      ? `${file.name}: its record couldn’t be saved. Ask the project owner to check the unindexed file at ${path}.`
      : `${file.name}: its record couldn’t be saved. The upload was removed; try again.`);
  }
}

export async function updateImage(id: string, fields: ImageUpdate) {
  const { data, error } = await createClient().from("gallery_images").update(fields).eq("id", id).select("id").single();
  if (error || !data) throw new Error("The change couldn’t be saved. Check your connection and team access, then try again.");
}

export async function originalUrl(image: GalleryImage) {
  const { data, error } = await createClient().storage.from("gallery-originals").createSignedUrl(image.storage_path, 60, { download: image.filename });
  if (error) throw new Error("The original couldn’t be opened. Try again.");
  return data.signedUrl;
}
