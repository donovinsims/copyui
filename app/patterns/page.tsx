"use client";

import { useRouter } from "next/navigation";
import { PatternsPage } from "@/src/docs/PatternStories";

export default function Page() {
  const router = useRouter();
  return <PatternsPage onComponents={() => router.push("/components")} />;
}
