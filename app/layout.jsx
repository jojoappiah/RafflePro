import "./globals.css"

export const metadata = {
  title: "RafflePro — The Lucky Draw",
  description: "Run a simple, fair phone-number raffle draw with RafflePro. Add entries, spin the reels, and celebrate your winner.",
}

export const viewport = {
  themeColor: "#101713",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>
}
