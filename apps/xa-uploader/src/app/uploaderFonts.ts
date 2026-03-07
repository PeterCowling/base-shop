import { IBM_Plex_Mono, Work_Sans } from "next/font/google";

export const uploaderDisplayFont = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const uploaderMonoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
