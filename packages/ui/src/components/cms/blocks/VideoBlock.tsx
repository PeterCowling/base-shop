"use client";
import React from "react";
import { VideoPlayer } from "../../atoms/VideoPlayer";

export interface VideoBlockProps {
  src?: string;
  autoplay?: boolean;
}

export default function VideoBlock({ src, autoplay = false }: VideoBlockProps) {
  if (!src) return null;
  return <VideoPlayer src={src} autoPlay={autoplay} className="w-full" />;
}
