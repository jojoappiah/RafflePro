import "./globals.css"

export const metadata = {
  title: "RafflePro — Make good things happen",
  description: "Bring people together around something worth winning. Create fair, simple, memorable raffles with RafflePro.",
}

export const viewport = {
  themeColor: "#f5f3eb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>
}
