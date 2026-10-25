import { renderPhoto } from "@/components/ProductPhoto";
import type { Shop } from "@/lib/api/types";
import styles from "./ShopSections.module.css";

/** Dükkânın kendi anlattığı tarihçe ve en çok üç atölye fotoğrafı. */
export function ShopStory({ shop }: { shop: Shop }) {
  const paragraphs = shop.story
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <section id="hikayemiz" aria-labelledby="hikaye" className={styles.block}>
      <h2 id="hikaye" className={styles.heading}>
        Hikâyemiz
      </h2>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className={styles.storyText}>
          {paragraph}
        </p>
      ))}
      {shop.storyPhotos.length > 0 && (
        <div className={styles.storyPhotos}>
          {shop.storyPhotos.map((url) => (
            <div key={url} className={styles.storyPhoto}>
              {renderPhoto(url, "(min-width: 1024px) 160px, 33vw")}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
