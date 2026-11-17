"use client";

import { useRouter } from "next/navigation";
import { ComponentsPage } from "@/src/docs/ComponentStories";

export default function Page() {
  const router = useRouter();
  return <ComponentsPage onOpenComponent={(slug) => router.push(`/components/${slug}`)} />;
}
