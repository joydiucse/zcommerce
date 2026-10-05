import { useRef, useState, type DragEvent } from "react";
import { TbArrowLeft, TbArrowRight, TbLoader2, TbPhotoPlus, TbStar, TbTrash, TbUpload } from "react-icons/tb";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUpload } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { cn, moveItem } from "@/lib/utils";
import type { ProductImage, UploadResult } from "@/types";

const MAX_BYTES = 5 * 1024 * 1024;

async function uploadFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name}: only images are allowed`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name}: images must be 5MB or smaller`);
  const res = await apiUpload<UploadResult>("tenant", "/uploads", file);
  return res.url;
}

function useDropzone(onFiles: (files: File[]) => void) {
  const [dragging, setDragging] = useState(false);
  return {
    dragging,
    handlers: {
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        setDragging(true);
      },
      onDragLeave: () => setDragging(false),
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length) onFiles(files);
      },
    },
  };
}

/** Single image upload (logo, favicon, category image, OG image, hero slide…). */
export function ImageUpload({
  value,
  onChange,
  className,
  aspect = "aspect-video",
  label = "Upload image",
  contain = false,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  className?: string;
  aspect?: string;
  label?: string;
  contain?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadFile(file));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  const dz = useDropzone(handle);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...dz.handlers}
        className={cn(
          "group bg-muted/30 relative flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspect,
          dz.dragging && "border-primary bg-primary/5",
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt=""
              className={cn("size-full", contain ? "object-contain p-3" : "object-cover")}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                <TbUpload /> Replace
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => onChange(null)}>
                <TbTrash /> Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground flex size-full flex-col items-center justify-center gap-1.5 p-4 text-sm"
          >
            <TbPhotoPlus className="size-7" />
            <span className="font-medium">{label}</span>
            <span className="text-xs">Drag & drop or click · max 5MB</span>
          </button>
        )}
        {busy && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center">
            <TbLoader2 className="size-6 animate-spin" />
          </div>
        )}
      </div>
      <Input
        value={value ?? ""}
        placeholder="…or paste an image URL"
        onChange={(e) => onChange(e.target.value || null)}
        className="h-8 text-xs"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}

/** Multiple images with alt text and ordering (products). First image is the primary. */
export function MultiImageUpload({
  value,
  onChange,
}: {
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const images = value ?? [];

  const handle = async (files: File[]) => {
    if (!files.length) return;
    setBusy(files.length);
    const uploaded: ProductImage[] = [];
    for (const f of files) {
      try {
        uploaded.push({ url: await uploadFile(f), alt: "" });
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        setBusy((b) => b - 1);
      }
    }
    if (uploaded.length) {
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
    if (inputRef.current) inputRef.current.value = "";
  };
  const dz = useDropzone(handle);

  const update = (i: number, patch: Partial<ProductImage>) =>
    onChange(images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <div key={`${img.url}-${i}`} className="bg-card overflow-hidden rounded-lg border">
            <div className="group bg-muted relative aspect-square">
              <img src={img.url} alt={img.alt} className="size-full object-cover" />
              {i === 0 && (
                <span className="bg-primary text-primary-foreground absolute top-2 left-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  <TbStar className="size-3" /> Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <Button type="button" size="icon-sm" variant="secondary" disabled={i === 0} onClick={() => onChange(moveItem(images, i, i - 1))} title="Move left">
                    <TbArrowLeft />
                  </Button>
                  <Button type="button" size="icon-sm" variant="secondary" disabled={i === images.length - 1} onClick={() => onChange(moveItem(images, i, i + 1))} title="Move right">
                    <TbArrowRight />
                  </Button>
                </div>
                <Button type="button" size="icon-sm" variant="destructive" onClick={() => onChange(images.filter((_, idx) => idx !== i))} title="Remove">
                  <TbTrash />
                </Button>
              </div>
            </div>
            <Input
              value={img.alt}
              placeholder="Alt text"
              onChange={(e) => update(i, { alt: e.target.value })}
              className="h-8 rounded-none border-0 border-t text-xs shadow-none focus-visible:ring-0"
            />
          </div>
        ))}
        <button
          type="button"
          {...dz.handlers}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "text-muted-foreground hover:text-foreground hover:border-primary/60 flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-sm transition-colors",
            dz.dragging && "border-primary bg-primary/5",
          )}
        >
          {busy > 0 ? <TbLoader2 className="size-6 animate-spin" /> : <TbPhotoPlus className="size-7" />}
          <span className="font-medium">{busy > 0 ? `Uploading ${busy}…` : "Add images"}</span>
          <span className="text-xs">max 5MB each</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handle(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}
