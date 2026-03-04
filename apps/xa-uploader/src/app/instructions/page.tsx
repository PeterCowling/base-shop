import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasUploaderSessionFromCookieHeader } from "../../lib/uploaderAuth";

import UploaderInstructionsClient from "./UploaderInstructions.client";

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default async function XaUploaderInstructionsPage() {
  const cookieHeader = (await headers()).get("cookie");
  const authenticated = await hasUploaderSessionFromCookieHeader(cookieHeader);
  if (!authenticated) {
    redirect("/login");
  }

  return (
    <UploaderInstructionsClient
      displayClassName={display.className}
      monoClassName={mono.className}
    />
  );
}
