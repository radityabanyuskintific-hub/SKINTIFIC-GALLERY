"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { PAGE_SIZE } from "@/lib/images";
import { listCollections, listImages, listTags, type Filters, type GalleryImage } from "@/lib/gallery-api";
import { SignOut } from "./sign-out";
import { UploadDialog } from "./upload-dialog";
import { ImageDetail } from "./image-detail";
import { PrivateImage } from "./private-image";

export function Gallery({ userId, email, canManage }: {userId: string | null; email: string | null; canManage: boolean}) {
  const optionsRef = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState("");
  const [tag, setTag] = useState("");
  const [trash, setTrash] = useState(false);
  const [sort, setSort] = useState<Filters["sort"]>("newest");
  const [notice, setNotice] = useState("");
  const [upload, setUpload] = useState(false);
  const [selected, setSelected] = useState<GalleryImage | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !optionsRef.current?.contains(event.target) && optionsRef.current) optionsRef.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && optionsRef.current?.open) {
        optionsRef.current.open = false;
        optionsRef.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  useEffect(() => { const timer = setTimeout(() => setSearch(query), 300); return () => clearTimeout(timer); }, [query]);
  const { data: collections = [], error: collectionError, mutate: refreshCollections } = useSWR(["gallery-collections", userId, canManage], listCollections);
  const { data: tags = [], error: tagError, mutate: refreshTags } = useSWR(["gallery-tags", userId, trash && canManage], ([,,trash]) => listTags(trash));
  const { data: pages, error: loadError, isLoading: loading, isValidating, size, setSize } = useSWRInfinite(
    index => ["gallery-images", search, collection, tag, trash && canManage, sort, index, revision, userId, canManage] as const,
    ([,query,collection,tag,trash,sort,index]) => listImages({query,collection,tag,trash,sort}, index * PAGE_SIZE),
    { refreshInterval:45 * 60 * 1000, revalidateOnFocus:true, shouldRetryOnError:false },
  );
  const images = [...new Map((pages ?? []).flatMap(page => page.images).map(image => [image.id,image])).values()];
  const count = pages?.[0]?.count ?? 0;
  const error: string = loadError?.message ?? "";
  const loadingMore = isValidating;
  function refresh() {setRevision(value => value + 1); void refreshCollections(); void refreshTags();}
  function saved(message: string) {setSelected(null); setUpload(false); setNotice(message); refresh();}
  function clearFilters() {setQuery(""); setSearch(""); setCollection(""); setTag("");}

  return <>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/">SKINTIFIC <span>Visual Bank</span></Link>
      <div className="search"><label htmlFor="search" className="sr-only">Search images</label><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="search" type="search" value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder="Search titles, tags, collections…" /></div>
      {canManage ? <button className="primary upload-button" onClick={() => setUpload(true)}><span aria-hidden="true">+</span> Upload images</button> : <Link className="primary upload-button button-link" href="/login">Sign in to upload</Link>}
      <details ref={optionsRef} className="gallery-options">
        <summary aria-label="Gallery options"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></summary>
        <div className="options-panel">
          {canManage && <nav className="view-tabs" aria-label="Gallery views"><button aria-pressed={!trash} onClick={() => {setTrash(false); clearFilters();}}>Library</button><button aria-pressed={trash} onClick={() => {setTrash(true); clearFilters();}}>Trash</button></nav>}
          <div className="selects"><label>Collection<select value={collection} onChange={event => setCollection(event.target.value)}><option value="">All collections</option>{collection && !collections.includes(collection) && <option value={collection}>{collection}</option>}{collections.map(name => <option key={name} value={name}>{name}</option>)}</select></label><label>Sort<select value={sort} onChange={event => setSort(event.target.value as Filters["sort"])}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label></div>
          <button className="text-button" onClick={refresh} disabled={loading || loadingMore}>Refresh</button>
          {email && <div className="account"><span title={email}>{email}</span><SignOut />{!canManage && <p className="field-help">Ask the project owner to enable uploads.</p>}</div>}
        </div>
      </details>
    </div></header>
    <main id="main" className="library">
      <h1 className="sr-only">{trash ? "Trash" : "Image library"}</h1>
      <nav className="tag-bar" aria-label="Filter by tag">
        <button aria-pressed={!tag} onClick={() => setTag("")}>{trash ? "All in Trash" : "All images"}</button>
        {[...new Set([...tags, ...(tag ? [tag] : [])])].map(name => <button key={name} aria-pressed={tag === name} onClick={() => setTag(tag === name ? "" : name)}>{name}</button>)}
      </nav>
      <p className="sr-only" aria-live="polite">{loading ? "Loading images" : `${count} images${trash ? " in Trash" : ""}`}</p>
      {(query || collection || tag || trash) && <div className="active-filters"><span>{trash ? "Trash · " : ""}{count} {count === 1 ? "image" : "images"}{query ? ` matching “${query}”` : ""}{collection ? ` · ${collection}` : ""}{tag ? ` · ${tag}` : ""}</span>{(query || collection || tag) && <button className="text-button" onClick={clearFilters}>Clear filters</button>}</div>}
      {notice && <div className="notice" role="status"><span>{notice}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
      {tagError && <p className="error" role="alert">{tagError.message}</p>}
      {collectionError && <p className="error" role="alert">{collectionError.message}</p>}
      {error && <section className="state-panel" role="alert"><h2>The library couldn’t load.</h2><p>{error}</p><button onClick={refresh}>Try again</button></section>}
      {loading ? <section className="state-panel" role="status"><p>Loading the reference library…</p></section> : !error && !images.length ? <section className="state-panel empty-state"><span className="empty-mark" aria-hidden="true">{trash ? "↶" : "+"}</span><h2>{query || collection || tag ? "No images match these filters." : trash ? "Nothing in Trash." : "Your library starts with an image."}</h2><p>{query || collection || tag ? "Try another search, tag, or collection." : trash ? "Images you remove will appear here. Their original files are kept until you restore them." : canManage ? "Add a reference, a material, a campaign, or a detail worth keeping." : "Images shared by the team will appear here."}</p>{query || collection || tag ? <button onClick={clearFilters}>Clear filters</button> : !trash && (canManage ? <button className="primary" onClick={() => setUpload(true)}>Upload your first images</button> : <Link className="primary button-link" href="/login">Sign in to upload</Link>)}</section> : <div className="gallery" aria-label="Image library" aria-busy={loadingMore}>{images.map(image => <article className="tile" key={image.id}><button className="tile-button" onClick={() => setSelected(image)} aria-label={`Open ${image.title}`}><span className="image-frame"><PrivateImage key={image.url} image={image}/></span></button></article>)}</div>}
      {!loading && !error && images.length < count && <div className="load-more"><button disabled={loadingMore} onClick={() => void setSize(size + 1)}>{loadingMore ? "Loading more images…" : "Load more images"}</button></div>}
    </main>
    {upload && canManage && userId && <UploadDialog userId={userId} collections={collections} onClose={() => {setUpload(false); refresh();}} onSaved={saved}/>}
    {selected && <ImageDetail image={selected} canManage={canManage} collections={collections} onClose={() => setSelected(null)} onSaved={saved}/>}
  </>;
}
