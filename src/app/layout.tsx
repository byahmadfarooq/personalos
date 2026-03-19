import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Personal OS",
  description: "Life & Business Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-bg text-text font-body min-h-screen">
        <div className="flex flex-col md:flex-row min-h-screen">
          <Navigation />
          <main className="flex-1 pb-24 md:pb-8 md:ml-20 lg:ml-64">
            <div className="max-w-7xl mx-auto px-4 py-6 md:px-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
