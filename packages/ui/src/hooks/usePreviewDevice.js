"use client";
import { useEffect, useState } from "react";
const STORAGE_KEY = "preview-device";
export function usePreviewDevice(initialId) {
    const [deviceId, setDeviceId] = useState(initialId);
    // load stored device on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setDeviceId(stored);
            }
        }
        catch {
            // ignore
        }
    }, []);
    // persist device on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, deviceId);
        }
        catch {
            // ignore
        }
    }, [deviceId]);
    return [deviceId, setDeviceId];
}
export const PREVIEW_DEVICE_STORAGE_KEY = STORAGE_KEY;
