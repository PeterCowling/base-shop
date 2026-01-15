/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route block renderer; head tags are supplied by the guide route meta()/links() exports per src/routes/AGENTS.md §3 */
import CfImage from "@/components/images/CfImage";
import buildCfImageUrl, { type BuildCfImageOptions } from "@/lib/buildCfImageUrl";

import type { BlockAccumulator } from "../blockAccumulator";
import type { HeroBlockOptions } from "../types";
import { DEFAULT_IMAGE_DIMENSIONS, isValidPreset, resolveTranslation } from "../utils";

export function applyHeroBlock(acc: BlockAccumulator, options: HeroBlockOptions): void {
  const resolved: HeroBlockOptions = {
    ...DEFAULT_IMAGE_DIMENSIONS,
    introLimit: options.introLimit,
    showIntro: options.showIntro ?? true,
    ...options,
  };

  acc.addSlot("lead", (context) => {
    const contentKey = acc.manifest.contentKey;
    const intlAlt =
      resolveTranslation(context.translateGuides, options.altKey, resolved.alt) ??
      resolveTranslation(context.translateGuides, `content.${contentKey}.heroAlt`, resolved.alt);
    const alt = intlAlt ?? context.article.title;

    const cfOptions: BuildCfImageOptions = {
      width: resolved.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
      height: resolved.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
      quality: resolved.quality ?? DEFAULT_IMAGE_DIMENSIONS.quality,
      format: resolved.format ?? DEFAULT_IMAGE_DIMENSIONS.format,
    };

    const src = buildCfImageUrl(resolved.image, cfOptions);
    const introLimit = resolved.introLimit && resolved.introLimit > 0 ? resolved.introLimit : undefined;
    const intro = Array.isArray(context.intro) ? context.intro : [];
    const introSnippets = resolved.showIntro === false ? [] : intro.slice(0, introLimit ?? intro.length);

    return (
      <div className={resolved.className ?? ""}>
        {introSnippets.map((paragraph, index) => (
          <p key={`guide-hero-intro-${index}`}>{paragraph}</p>
        ))}
        <CfImage
          src={src}
          alt={alt ?? context.article.title}
          width={cfOptions.width}
          height={cfOptions.height}
          preset={isValidPreset(resolved.preset) ? resolved.preset : "hero"}
          data-aspect={resolved.aspectRatio}
        />
      </div>
    );
  });
}
