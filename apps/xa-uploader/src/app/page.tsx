import { IBM_Plex_Mono, Work_Sans } from "next/font/google";

import UploaderHomeClient from "./UploaderHome.client";

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function XaUploaderHomePage() {
  return (
    <UploaderHomeClient displayClassName={display.className} monoClassName={mono.className} />
  );
}
