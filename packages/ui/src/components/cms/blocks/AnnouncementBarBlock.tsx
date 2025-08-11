import AnnouncementBar from "../../organisms/AnnouncementBar";

interface Props {
  text?: string;
  link?: string;
  closable?: boolean;
}

/** CMS wrapper for the AnnouncementBar organism */
export default function AnnouncementBarBlock({ text, link, closable }: Props) {
  if (!text) return null;
  return <AnnouncementBar text={text} href={link} closable={closable} />;
}
