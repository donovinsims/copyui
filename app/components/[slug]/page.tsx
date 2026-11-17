"use client";

import { useParams, useRouter } from "next/navigation";
import { ComponentDetailPage } from "@/src/docs/ComponentDetail";
import { useTheme } from "@/src/site/theme";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { theme, setTheme } = useTheme();
  const slug = Array.isArray(params.slug) ? params.slug[0]! : params.slug;

  return (
    <ComponentDetailPage
      slug={slug}
      theme={theme}
      onTheme={setTheme}
      onBack={() => router.push("/components")}
      onOpen={(next) => router.push(`/components/${next}`)}
    />
  );
}
