"use client";

import { useParams, useRouter } from "next/navigation";
import { CategoryPage, LIBRARY_CATEGORY, type LibraryCategory } from "@/src/docs/ComponentStories";

const CATEGORIES = Object.keys(LIBRARY_CATEGORY) as LibraryCategory[];

export default function Page() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const raw = Array.isArray(params.category) ? params.category[0]! : params.category;
  const category = CATEGORIES.find((entry) => entry === raw) ?? "chat";

  return (
    <CategoryPage
      category={category}
      onOpenComponent={(slug) => router.push(`/components/${slug}`)}
      onCategory={(next) => router.push(`/components/category/${next}`)}
    />
  );
}
