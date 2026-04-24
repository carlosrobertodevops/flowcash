import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowCash",
  description: "Controle pessoal de contas a pagar e a receber.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
