import { Inter, Lato, Montserrat, Open_Sans, Playfair_Display, Poppins, Roboto } from "next/font/google";

// Only the selected font is referenced by CSS, so browsers download just that one.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
  preload: false,
});
const roboto = Roboto({ subsets: ["latin"], display: "swap", variable: "--font-roboto", preload: false });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--font-lato", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", variable: "--font-montserrat", preload: false });
const openSans = Open_Sans({ subsets: ["latin"], display: "swap", variable: "--font-open-sans", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", variable: "--font-playfair", preload: false });

const FONTS = {
  inter,
  poppins,
  roboto,
  lato,
  montserrat,
  "open sans": openSans,
  "playfair display": playfair,
} as const;

/** Returns the CSS variable reference for the configured font family (falls back to Inter). */
export function fontVar(family: string | undefined): string {
  const key = (family || "inter").trim().toLowerCase() as keyof typeof FONTS;
  const font = FONTS[key] ?? inter;
  return font.style.fontFamily;
}
