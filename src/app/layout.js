import "./globals.css";
import { SessionProvider } from "./providers";

export const metadata = {
  title: "AI Social Post — Premium Social Media Post Generator",
  description:
    "Generate highly optimized, engaging social media posts with AI. Adapt descriptions, hooks, and call-to-actions specifically for LinkedIn, Twitter, Facebook, and Instagram instantly.",
  keywords: "AI social media, post generator, LinkedIn generator, tweet generator, copywriter, digital marketing",
  openGraph: {
    title: "AI Social Post — Premium Social Media Post Generator",
    description: "Generate highly optimized, engaging social media posts with AI.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/11407/5272b774-1dec-479f-9b03-bb7eeb892b80.jpg" />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
