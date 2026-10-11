"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteVehicleImage, reorderVehicleImages } from "@/lib/actions/vehicle";

/* ── Multi-image handling for the admin forms ─────────────────────────────
   Two pieces, both drag-to-reorder, both treating position 0 as the cover:

   • NewImagePicker  — files chosen but not uploaded yet. Order is held in
     React state and mirrored back into a real file input through a
     DataTransfer, so the existing server action still receives them under
     the same `images` field, in the order shown.

   • ExistingImages  — rows already in VehicleImage. Reordering writes
     straight through to `reorderVehicleImages`; the list is reordered
     locally first so the drag does not snap back while the action runs.  */

const CELL =
  "group relative aspect-[4/3] overflow-hidden rounded-lg border border-black/[.08] bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-800";
const HINT = "text-xs text-zinc-500 dark:text-zinc-400";
const CHIP =
  "absolute left-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white";
const ICON_BTN =
  "flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs leading-none text-white transition-opacity hover:bg-black disabled:opacity-30";

const REORDER_HINT = "Drag to reorder — the first photo is the cover.";

/** Shared drag plumbing: returns the handlers for one tile at `index`. */
function useDragOrder(onMove: (from: number, to: number) => void) {
  const dragging = useRef<number | null>(null);

  return (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragging.current = index;
      e.dataTransfer.effectAllowed = "move";
      // Firefox will not start a drag unless some data is set.
      e.dataTransfer.setData("text/plain", String(index));
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragging.current;
      dragging.current = null;
      if (from === null || from === index) return;
      onMove(from, index);
    },
    onDragEnd: () => {
      dragging.current = null;
    },
  });
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* ── Files picked but not yet uploaded ─────────────────────────────────── */

export function NewImagePicker({
  name = "images",
  label = "Upload photos",
}: {
  name?: string;
  label?: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  /** The input that actually submits — kept in sync with `files`. */
  const submitRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  // Derived, not stored: one object URL per file, released when the list
  // changes or the picker unmounts.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  useEffect(() => {
    const input = submitRef.current;
    if (!input || typeof DataTransfer !== "function") return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  }, [files]);

  const add = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(picked)]);
    // Let the same file be picked again after a removal.
    if (pickRef.current) pickRef.current.value = "";
  };

  const drag = useDragOrder((from, to) => setFiles((prev) => move(prev, from, to)));

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm text-zinc-700 dark:text-zinc-300">{label}</label>

      {/* What the form posts. Hidden, never clicked directly. */}
      <input
        ref={submitRef}
        type="file"
        name={name}
        accept="image/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => add(e.target.files)}
        className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:text-zinc-700 hover:file:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark] dark:file:bg-zinc-800 dark:file:text-white dark:hover:file:bg-zinc-700"
      />

      {files.length > 0 && (
        <>
          <p className={HINT}>{REORDER_HINT}</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {files.map((file, i) => (
              <li key={`${file.name}-${file.lastModified}-${i}`} className={CELL} {...drag(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previews[i]}
                  alt=""
                  className="h-full w-full cursor-grab object-cover active:cursor-grabbing"
                />
                {i === 0 && <span className={CHIP}>Cover</span>}
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" className={ICON_BTN} title="Move earlier" disabled={i === 0} onClick={() => setFiles((p) => move(p, i, i - 1))}>
                    &lsaquo;
                  </button>
                  <button type="button" className={ICON_BTN} title="Move later" disabled={i === files.length - 1} onClick={() => setFiles((p) => move(p, i, i + 1))}>
                    &rsaquo;
                  </button>
                  <button type="button" className={ICON_BTN} title="Remove" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
                    &#10005;
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ── Images already saved against the vehicle ──────────────────────────── */

type SavedImage = { id: string; url: string };

export function ExistingImages({
  vehicleId,
  images,
}: {
  vehicleId: string;
  images: SavedImage[];
}) {
  const [order, setOrder] = useState<SavedImage[]>(images);
  const [pending, startTransition] = useTransition();

  // The server is the source of truth again once it revalidates. `images` is
  // a fresh array on every render, so the ids are what we compare — adjusted
  // during render rather than in an effect, which would cascade.
  const signature = images.map((i) => i.id).join(",");
  const [seen, setSeen] = useState(signature);
  if (seen !== signature) {
    setSeen(signature);
    setOrder(images);
  }

  const commit = (next: SavedImage[]) => {
    setOrder(next);
    startTransition(() => {
      void reorderVehicleImages(vehicleId, next.map((i) => i.id));
    });
  };

  const drag = useDragOrder((from, to) => commit(move(order, from, to)));

  if (order.length === 0) return null;

  return (
    <div className="mb-8 rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-sm text-zinc-500">Current photos</h2>
        <p className={HINT}>{pending ? "Saving order…" : REORDER_HINT}</p>
      </div>

      <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
        {order.map((image, i) => (
          <li key={image.id} className={CELL} {...drag(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              className="h-full w-full cursor-grab object-cover transition-transform duration-300 group-hover:scale-105 active:cursor-grabbing"
            />
            {i === 0 && <span className={CHIP}>Cover</span>}
            <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" className={ICON_BTN} title="Move earlier" disabled={i === 0} onClick={() => commit(move(order, i, i - 1))}>
                &lsaquo;
              </button>
              <button type="button" className={ICON_BTN} title="Move later" disabled={i === order.length - 1} onClick={() => commit(move(order, i, i + 1))}>
                &rsaquo;
              </button>
              <button
                type="button"
                className={ICON_BTN}
                title="Delete photo"
                onClick={() => {
                  setOrder((p) => p.filter((img) => img.id !== image.id));
                  startTransition(() => {
                    void deleteVehicleImage(image.id, vehicleId);
                  });
                }}
              >
                &#10005;
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
