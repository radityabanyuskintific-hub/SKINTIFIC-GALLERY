"use client";
import { useState } from "react";
import { Modal } from "./modal";
import { originalUrl, updateImage, type GalleryImage } from "@/lib/gallery-api";
import { formatBytes, parseTags, validateMetadata } from "@/lib/images";
import { PrivateImage } from "./private-image";

export function ImageDetail({ image, canManage, collections, onClose, onSaved }: {image: GalleryImage; canManage: boolean; collections: string[]; onClose: () => void; onSaved: (message: string) => void}) {
  const [editing, setEditing] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(fields: Parameters<typeof updateImage>[1], message: string) {
    setBusy(true); setError("");
    try { await updateImage(image.id, fields); onSaved(message); }
    catch(error) {setError(error instanceof Error ? error.message : "Couldn’t save changes.");}
    finally {setBusy(false);}
  }
  return <Modal title={editing ? "Edit image details" : image.title} onClose={onClose} wide busy={busy}>
    <div className="detail-layout"><div className="detail-image"><PrivateImage image={image} /></div><div className="detail-info">
      {editing ? <form onSubmit={async event => {
        event.preventDefault(); const data = new FormData(event.currentTarget);
        try {
          const title = String(data.get("title")).trim(); const collection = String(data.get("collection")).trim();
          validateMetadata(title, collection);
          await save({title, collection, tags: parseTags(String(data.get("tags")))}, "Image details saved.");
        } catch(error) {setError(error instanceof Error ? error.message : "Check the image details.");}
      }}>
        <label className="field">Title<input name="title" defaultValue={image.title} maxLength={160} required disabled={busy} /></label>
        <label className="field">Collection<input name="collection" list="edit-collections" defaultValue={image.collection} maxLength={80} disabled={busy} /></label>
        <datalist id="edit-collections">{collections.map(name => <option key={name} value={name} />)}</datalist>
        <label className="field">Tags<input name="tags" defaultValue={image.tags.join(", ")} disabled={busy}/><span className="field-help">Separate tags with commas.</span></label>
        <div className="form-actions"><button type="button" disabled={busy} onClick={() => {setEditing(false); setError("");}}>Cancel edit</button><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
      </form> : <>
        <p className="detail-collection">{image.collection || "Uncollected"}</p>
        <dl className="metadata"><div><dt>File</dt><dd>{image.filename}</dd></div><div><dt>Dimensions</dt><dd>{image.width} × {image.height}</dd></div><div><dt>Size</dt><dd>{formatBytes(image.bytes)}</dd></div><div><dt>Added</dt><dd>{new Date(image.created_at).toLocaleDateString("en-GB", {timeZone:"Asia/Jakarta"})}</dd></div></dl>
        {image.tags.length ? <ul className="tags" aria-label="Tags">{image.tags.map(tag => <li key={tag}>{tag}</li>)}</ul> : <p className="muted">No tags yet.</p>}
        <div className="detail-actions">
          <button className="primary" disabled={busy} onClick={async () => {
            setBusy(true); setError("");
            try { const href = await originalUrl(image); const link = document.createElement("a"); link.href = href; link.download = image.filename; link.rel = "noreferrer"; link.click(); }
            catch {setError("The original couldn’t be downloaded. Try again.");}
            finally {setBusy(false);}
          }}>Download original</button>
          {canManage && (image.deleted_at ? <button disabled={busy} onClick={() => save({deleted_at: null}, "Image restored to the library.")}>Restore image</button> : <>
            <button disabled={busy} onClick={() => setEditing(true)}>Edit details</button>
            <button className="danger" disabled={busy} onClick={() => setConfirmTrash(true)}>Move to Trash</button>
          </>)}
        </div>
        {image.deleted_at && <p className="muted">This image is in Trash. Its original file is retained.</p>}
        {confirmTrash && <section className="confirmation" aria-label="Confirm move to Trash"><h3>Move this image to Trash?</h3><p>It will leave the library. You can restore it from Trash.</p><div className="form-actions"><button disabled={busy} onClick={() => setConfirmTrash(false)}>Keep image</button><button className="danger" disabled={busy} onClick={() => save({deleted_at: new Date().toISOString()}, "Image moved to Trash.")}>Confirm move to Trash</button></div></section>}
      </>}
      {error && <p className="error" role="alert">{error}</p>}
    </div></div>
  </Modal>;
}
