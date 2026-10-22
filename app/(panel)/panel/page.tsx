import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderBoard } from "./_components/OrderBoard";
import { panelSession, parseDayView } from "./_lib";

export const metadata: Metadata = { title: "Bugün" };

export default function TodayPage({ searchParams }: PageProps<"/panel">) {
  return (
    <Suspense>
      <Today searchParams={searchParams} />
    </Suspense>
  );
}

async function Today({ searchParams }: Pick<PageProps<"/panel">, "searchParams">) {
  const [session, query] = await Promise.all([panelSession(), searchParams]);
  return <OrderBoard session={session} view={parseDayView(query.gun)} />;
}
