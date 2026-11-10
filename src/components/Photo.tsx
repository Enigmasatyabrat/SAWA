import Image from "next/image";
import type { SitePhoto } from "@/lib/photos";

/** A credited photograph with a caption. Square corners, no frame: the picture is the surface. */
export default function Photo({
  photo,
  priority = false,
  aspect = "aspect-[16/9]",
  sizes = "(min-width: 1152px) 1152px, 100vw",
  className = "",
}: {
  photo: SitePhoto;
  priority?: boolean;
  aspect?: string;
  sizes?: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div className={`relative w-full overflow-hidden bg-bg-alt ${aspect}`}>
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
      <figcaption className="mt-3 text-sm text-ink-soft">{photo.caption}</figcaption>
    </figure>
  );
}
