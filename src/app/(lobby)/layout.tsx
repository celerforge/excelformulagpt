import { Footer } from "@/components/footer";
import Header from "@/components/header";
import "@/styles/globals.css";
import "@/styles/mdx.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header className="border-b" />
      <main>{children}</main>
      <Footer />
    </>
  );
}
