import type { GuideContentInput,GuidePublication } from "@acme/types";

export interface GuidesRepository {
  read<T = GuidePublication>(shop: string): Promise<T[]>;
  write<T = GuidePublication>(shop: string, guides: T[]): Promise<void>;
  getById<T extends { id: string } = GuidePublication>(
    shop: string,
    id: string,
  ): Promise<T | null>;
  getByKey(shop: string, key: string): Promise<GuidePublication | null>;
  update<T extends { id: string; row_version: number } = GuidePublication>(
    shop: string,
    patch: Partial<T> & { id: string },
  ): Promise<T>;
  delete(shop: string, id: string): Promise<void>;
  duplicate<T extends GuidePublication = GuidePublication>(
    shop: string,
    id: string,
  ): Promise<T>;
  getContent(
    shop: string,
    key: string,
    locale: string,
  ): Promise<GuideContentInput | null>;
  writeContent(
    shop: string,
    key: string,
    locale: string,
    content: GuideContentInput,
  ): Promise<void>;
}
