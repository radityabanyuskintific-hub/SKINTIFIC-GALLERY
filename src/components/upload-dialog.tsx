"use client";
import { useState } from "react";
import { Modal } from "./modal";
import { uploadImage } from "@/lib/gallery-api";
import { parseTags, validateFile } from "@/lib/images";

export function UploadDialog({ userId, collections, onClose, onSaved }: {userId: string; collections: string[]; onClose: () => void; onSaved: (message: string) => void}) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  return <Modal title="Add to the library" onClose={onClose} busy={busy}>
    <form className="modal-body" onSubmit={async event => {
      event.preventDefault(); setMessage("");
      const values = new FormData(event.currentTarget);
      let completed = 0;
      try {
        if (!files.length) throw new Error("Choose at least one image.");
        if (files.length > 20) throw new Error("Upload up to 20 images at a time.");
        files.forEach(validateFile);
        const tags = parseTags(String(values.get("tags")));
        setBusy(true);
        for (const file of files) {
          setProgress(`Uploading ${completed + 1} of ${files.length}: ${file.name}`);
          await uploadImage(file, userId, {title: files.length === 1 ? String(values.get("title")) : file.name.replace(/\.[^.]+$/, "").slice(0, 160), collection: String(values.get("collection")), tags});
          completed++;
        }
        onSaved(`${completed} ${completed === 1 ? "image added" : "images added"} to the library.`);
      } catch (error) {
        setFiles(current => current.slice(completed));
        setMessage(`${completed ? `${completed} uploaded. ` : ""}${error instanceof Error ? error.message : "Upload failed. Please try again."}`);
      } finally { setBusy(false); setProgress(""); }
    }}>
      <p className="muted">Upload originals and add a few details so the team can find them.</p>
      <label className="file-picker field">Choose images<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={busy} onChange={event => {setFiles(Array.from(event.target.files ?? [])); setMessage("");}} /><span className="field-help">JPG, PNG, WebP, GIF · Up to 15 MB each · 20 files per batch</span></label>
      {files.length > 0 && <p className="selected-files">{files.length} selected: {files.map(file => file.name).join(", ")}</p>}
      {files.length === 1 && <label className="field" key={files[0].name}>Title<input name="title" defaultValue={files[0].name.replace(/\.[^.]+$/, "").slice(0,160)} maxLength={160} required disabled={busy} /></label>}
      <label className="field">Collection<input name="collection" list="upload-collections" placeholder="e.g. Packaging references" maxLength={80} disabled={busy} /><span className="field-help">Choose an existing collection or type a new name.</span></label>
      <datalist id="upload-collections">{collections.map(name => <option key={name} value={name} />)}</datalist>
      <label className="field">Tags<input name="tags" placeholder="e.g. glass, blue, skincare" disabled={busy} /><span className="field-help">Separate tags with commas.</span></label>
      {message && <p className="error" role="alert">{message}</p>}
      <p role="status" className="upload-progress">{progress}</p>
      <div className="form-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="primary" disabled={busy || !files.length}>{busy ? "Uploading…" : "Upload images"}</button></div>
    </form>
  </Modal>;
}
