import type { Metadata } from "next";
import { Suspense } from "react";
import { getCannedReplies } from "@/lib/api";
import { ticketCategoryLabel } from "@/lib/support";
import styles from "../_components/support.module.css";

export const metadata: Metadata = { title: "Hazır cevaplar" };

export default function CannedPage() {
  return (
    <Suspense>
      <Canned />
    </Suspense>
  );
}

async function Canned() {
  const replies = await getCannedReplies();
  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Hazır cevaplar</h1>
        <span className={styles.muted}>Talep detayında &ldquo;Hazır cevap&rdquo; ile yanıt alanına eklenir.</span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Kategori</th>
              <th>Metin</th>
            </tr>
          </thead>
          <tbody>
            {replies.map((r) => (
              <tr key={r.id}>
                <td className={styles.nowrap}>
                  <b>{r.title}</b>
                </td>
                <td>{ticketCategoryLabel[r.category]}</td>
                <td>{r.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
