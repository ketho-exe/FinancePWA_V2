import type { ReactNode } from "react";

import "./globals.css";

const themeScript = `
  (() => {
    const storageKey = "finance-theme";
    const storedTheme = window.localStorage.getItem(storageKey);
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const theme = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : systemTheme;

    document.documentElement.dataset.theme = theme;
  })();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style>{`
          html[data-theme="light"] {
            --bg: #f5efe3;
            --fg: #172129;
            --muted: #5e6b75;
            --panel: rgba(255, 251, 245, 0.78);
            --panel-border: rgba(23, 33, 41, 0.12);
            --nav-item: rgba(255, 255, 255, 0.72);
          }

          html[data-theme="dark"] {
            --bg: #101a23;
            --fg: #eef2f4;
            --muted: #99a9b5;
            --panel: rgba(16, 26, 35, 0.74);
            --panel-border: rgba(238, 242, 244, 0.12);
            --nav-item: rgba(255, 255, 255, 0.06);
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
