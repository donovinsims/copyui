import type { Metadata, Viewport } from "next";
import "../src/styles/tokens.css";
import "../src/styles/base.css";
import "../src/docs/docs.css";
import { ThemeProvider } from "../src/site/theme";
import { Shell } from "../src/site/Shell";

export const metadata: Metadata = {
  title: "copyui — a token-driven React design system",
  description:
    "copyui is an owned React design system: tokens, self-contained primitives, agent surfaces and a self-hosted shadcn registry.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem("copyui-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
