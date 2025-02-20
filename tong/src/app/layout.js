// tong/src/app/layout.jsx
import { AuthProvider } from "../context/AuthProvider";
import Navbar from "../app/components/navbar";
import "../globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}