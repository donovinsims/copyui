"use client";

import { useRouter } from "next/navigation";
import { OverviewPage } from "@/src/docs/Docs";

export default function Page() {
  const router = useRouter();
  return (
    <OverviewPage
      onBrowse={() => router.push("/components")}
      onTokens={() => router.push("/tokens")}
    />
  );
}
