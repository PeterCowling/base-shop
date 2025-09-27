"use client";

// Identity builders keep file boundaries clean while preserving types

export function buildToolbarProps<T>(args: T): T { return { ...args }; }

export function buildGridProps<T>(args: T): T { return { ...args }; }

export function buildCanvasProps<T>(args: T): T { return { ...args }; }

export function buildPreviewProps<T>(args: T): T { return { ...args }; }

export function buildHistoryProps<T>(args: T): T { return { ...args }; }

export function buildToastProps<T>(args: T): T { return { ...args }; }

export function buildTourProps<T>(args: T): T { return { ...args }; }
