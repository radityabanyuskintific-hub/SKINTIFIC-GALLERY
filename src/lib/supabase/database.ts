export type ImageRow = {
  id: string; owner_id: string; storage_path: string; title: string;
  filename: string; collection: string; tags: string[]; mime_type: string;
  bytes: number; width: number; height: number; created_at: string;
  updated_at: string; deleted_at: string | null; search_document: unknown;
};
export type ImageInsert = Omit<ImageRow, "created_at" | "updated_at" | "deleted_at" | "search_document">;
export type ImageUpdate = Partial<Pick<ImageRow, "title" | "collection" | "tags" | "deleted_at">>;
export type Database = {
  public: {
    Tables: {
      gallery_members: { Row: { user_id: string; active: boolean; created_at: string }; Insert: { user_id: string; active?: boolean }; Update: { active?: boolean }; Relationships: [] };
      gallery_images: { Row: ImageRow; Insert: ImageInsert; Update: ImageUpdate; Relationships: [] };
    };
    Views: { gallery_collections: { Row: { name: string | null; image_count: number | null }; Relationships: [] } };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
