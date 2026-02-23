"use server";

import {
  generateSeo as serviceGenerateSeo,
  revertSeo as serviceRevertSeo,
  updateSeo as serviceUpdateSeo,
} from "../services/shops/seoService";

export async function updateSeo(shop: string, formData: FormData) {
  return serviceUpdateSeo(shop, formData);
}

export async function generateSeo(shop: string, formData: FormData) {
  return serviceGenerateSeo(shop, formData);
}

export async function revertSeo(shop: string, timestamp: string) {
  return serviceRevertSeo(shop, timestamp);
}
