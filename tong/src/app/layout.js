// src/app/layout.jsx
import { AuthProvider } from "../context/AuthProvider";
import Navbar from "../app/components/Navbar";
import "../globals.css";
import Head from 'next/head';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Tong</title>
        <meta name="description" content="Welcome to Tong" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
