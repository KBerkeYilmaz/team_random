import { Inter, Permanent_Marker, Pixelify_Sans } from "next/font/google";

export const inter = Inter({
    weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
    style: ["normal"],
    subsets: ["latin"],
    display: "swap",
});
export const permanentMarker = Permanent_Marker({
    weight: ["400"],
    subsets: ["latin"],
});

export const pixelify = Pixelify_Sans({
    weight: ["400"],
    subsets: ["latin"],
});