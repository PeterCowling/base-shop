"use server";

// apps/cms/src/actions/blog.server.ts

import {
  createPost as serviceCreatePost,
  deletePost as serviceDeletePost,
  getPost as serviceGetPost,
  getPosts as serviceGetPosts,
  publishPost as servicePublishPost,
  type SanityPost,
  unpublishPost as serviceUnpublishPost,
  updatePost as serviceUpdatePost,
} from "../services/blog";

export async function getPosts(shopId: string): Promise<SanityPost[]> {
  return serviceGetPosts(shopId);
}

export async function getPost(shopId: string, id: string): Promise<SanityPost | null> {
  return serviceGetPost(shopId, id);
}

export async function createPost(
  shopId: string,
  _prev: unknown,
  formData: FormData,
): Promise<{ message?: string; error?: string; id?: string }> {
  return serviceCreatePost(shopId, formData);
}

export async function updatePost(
  shopId: string,
  _prev: unknown,
  formData: FormData,
): Promise<{ message?: string; error?: string }> {
  return serviceUpdatePost(shopId, formData);
}

export async function publishPost(
  shopId: string,
  id: string,
  _prev?: unknown,
  formData?: FormData,
): Promise<{ message?: string; error?: string }> {
  return servicePublishPost(shopId, id, formData);
}

export async function unpublishPost(
  shopId: string,
  id: string,
  _prev?: unknown,
  _formData?: FormData,
): Promise<{ message?: string; error?: string }> {
  return serviceUnpublishPost(shopId, id);
}

export async function deletePost(
  shopId: string,
  id: string,
): Promise<{ message?: string; error?: string }> {
  return serviceDeletePost(shopId, id);
}

export type { SanityPost };
