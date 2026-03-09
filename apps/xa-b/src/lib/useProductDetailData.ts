import { siteConfig } from "./siteConfig";
import { toWhatsappHref } from "./support";
import {
  formatLabel,
  getDepartmentCategoryHref,
  getDepartmentCategorySubcategoryHref,
  getDesignerName,
  isProductImage,
} from "./xaCatalog";
import type { XaProduct } from "./xaCatalogModel";
import { xaI18n } from "./xaI18n";
import { getProductHref } from "./xaRoutes";

export function useProductDetailData(product: XaProduct, products: XaProduct[]) {
  const designerName = getDesignerName(product.brand);
  const categoryLabel = formatLabel(product.taxonomy.category);
  const categoryHref = getDepartmentCategoryHref(
    product.taxonomy.department,
    product.taxonomy.category,
  );
  const subcategoryLabel = formatLabel(product.taxonomy.subcategory);
  const subcategoryHref = getDepartmentCategorySubcategoryHref(
    product.taxonomy.department,
    product.taxonomy.category,
    product.taxonomy.subcategory,
  );
  const canonicalUrl = siteConfig.domain
    ? `https://${siteConfig.domain}${getProductHref(product.slug)}`
    : "";
  const primaryImage = product.media.find(isProductImage)?.url;
  const showSocialLinks = siteConfig.showSocialLinks;
  const showContactInfo = siteConfig.showContactInfo;
  const showShare = Boolean(canonicalUrl) && !siteConfig.stealthMode;
  const whatsappHref = showSocialLinks
    ? toWhatsappHref(siteConfig.whatsappNumber)
    : null;

  const copy = {
    home: xaI18n.t("xaB.src.app.products.handle.page.copy.home"),
    sizeFit: xaI18n.t("xaB.src.app.products.handle.page.copy.sizeFit"),
    modelIs: xaI18n.t("xaB.src.app.products.handle.page.copy.modelIs", {
      height: product.details?.modelHeight ?? "",
    }),
    wearsSize: xaI18n.t("xaB.src.app.products.handle.page.copy.wearsSize", {
      size: product.details?.modelSize ?? "",
    }),
    sizeGuideFallback: xaI18n.t("xaB.src.app.products.handle.page.copy.sizeGuideFallback"),
    bagDetails: xaI18n.t("xaB.src.app.products.handle.page.copy.bagDetails"),
    dimensions: xaI18n.t("xaB.src.app.products.handle.page.copy.dimensions", {
      value: product.details?.dimensions ?? "",
    }),
    strapDrop: xaI18n.t("xaB.src.app.products.handle.page.copy.strapDrop", {
      value: product.details?.strapDrop ?? "",
    }),
    whatFits: xaI18n.t("xaB.src.app.products.handle.page.copy.whatFits"),
    interior: xaI18n.t("xaB.src.app.products.handle.page.copy.interior"),
    metal: xaI18n.t("xaB.src.app.products.handle.page.copy.metal"),
    stone: xaI18n.t("xaB.src.app.products.handle.page.copy.stone"),
    size: xaI18n.t("xaB.src.app.products.handle.page.copy.size"),
    share: xaI18n.t("xaB.src.app.products.handle.page.copy.share"),
    contact: xaI18n.t("xaB.src.app.products.handle.page.copy.contact"),
    facebook: xaI18n.t("xaB.src.app.products.handle.page.copy.facebook"),
    twitter: xaI18n.t("xaB.src.app.products.handle.page.copy.twitter"),
    pinterest: xaI18n.t("xaB.src.app.products.handle.page.copy.pinterest"),
    linkedIn: xaI18n.t("xaB.src.app.products.handle.page.copy.linkedIn"),
    whatsapp: xaI18n.t("xaB.src.app.products.handle.page.copy.whatsapp"),
    email: xaI18n.t("xaB.src.app.products.handle.page.copy.email"),
    instagram: xaI18n.t("xaB.src.app.products.handle.page.copy.instagram"),
    wechat: xaI18n.t("xaB.src.app.products.handle.page.copy.wechat"),
    moreFromDesigner: xaI18n.t("xaB.src.app.products.handle.page.copy.moreFromDesigner", {
      designerName,
    }),
    clothingMaterialLabel: xaI18n.t("xaB.src.app.products.handle.page.l103c60"),
    jewelryDetailsLabel: xaI18n.t("xaB.src.app.products.handle.page.l151c60"),
    jewelrySizePrefix: xaI18n.t("xaB.src.app.products.handle.page.l163c30"),
    jewelryCareLabel: xaI18n.t("xaB.src.app.products.handle.page.l169c60"),
    businessHoursPrefix: xaI18n.t("xaB.src.app.products.handle.page.l265c30"),
    completeLookLabel: xaI18n.t("xaB.src.app.products.handle.page.l287c49"),
  };

  const completeLook = products
    .filter(
      (item) =>
        item.slug !== product.slug &&
        item.taxonomy.department === product.taxonomy.department &&
        item.taxonomy.category !== product.taxonomy.category,
    )
    .slice(0, 4);

  const moreFromDesigner = products
    .filter((item) => item.slug !== product.slug && item.brand === product.brand)
    .slice(0, 4);

  return {
    designerName,
    categoryLabel,
    categoryHref,
    subcategoryLabel,
    subcategoryHref,
    canonicalUrl,
    primaryImage,
    showSocialLinks,
    showContactInfo,
    showShare,
    whatsappHref,
    copy,
    completeLook,
    moreFromDesigner,
  };
}
