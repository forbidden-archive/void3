import "./globals.css";

export const metadata = {
  title: "CONNECTING VOID",
  description: "VOID TOWER ARCHIVE"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
