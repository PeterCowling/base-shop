"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { locales } from "@acme/i18n/locales";
import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, closestCenter, } from "@dnd-kit/core";
const STATUS = { FINISHED: "finished", SKIPPED: "skipped" };
function Joyride({ run, callback }) {
    useEffect(() => {
        if (run) {
            callback?.({ status: STATUS.FINISHED });
        }
    }, [run, callback]);
    return null;
}
import { Button } from "../../atoms/shadcn";
import { Toast, Spinner } from "../../atoms";
import { CheckIcon } from "@radix-ui/react-icons";
import Palette from "./Palette";
import { getShopFromPath } from "@acme/platform-core/utils";
import { ulid } from "ulid";
import useFileDrop from "./hooks/useFileDrop";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePageBuilderDnD from "./hooks/usePageBuilderDnD";
import useViewport from "./hooks/useViewport";
import PageToolbar from "./PageToolbar";
import PageCanvas from "./PageCanvas";
import PageSidebar from "./PageSidebar";
import { defaults, CONTAINER_TYPES } from "./defaults";
import { devicePresets, getLegacyPreset } from "../../../utils/devicePresets";
import { usePreviewDevice } from "../../../hooks";
import DeviceSelector from "../../common/DeviceSelector";
import DynamicRenderer from "../../DynamicRenderer";
const PageBuilder = memo(function PageBuilder({ page, history: historyProp, onSave, onPublish, saving = false, publishing = false, saveError, publishError, onChange, style, }) {
    const formDataRef = useRef(null);
    const handleSaveShortcut = useCallback(() => {
        if (formDataRef.current) {
            void onSave(formDataRef.current);
        }
    }, [onSave]);
    const { state, components, dispatch, selectedId, setSelectedId, gridCols, setGridCols, liveMessage, clearHistory, } = usePageBuilderState({
        page,
        history: historyProp,
        onChange,
        onSaveShortcut: handleSaveShortcut,
        onTogglePreview: () => setShowPreview((p) => !p),
        onRotateDevice: () => setOrientation((o) => (o === "portrait" ? "landscape" : "portrait")),
    });
    const [deviceId, setDeviceId] = usePreviewDevice(devicePresets[0].id);
    const [orientation, setOrientation] = useState("portrait");
    const device = useMemo(() => {
        const preset = devicePresets.find((d) => d.id === deviceId) ??
            devicePresets[0];
        return orientation === "portrait"
            ? { ...preset, orientation }
            : {
                ...preset,
                width: preset.height,
                height: preset.width,
                orientation,
            };
    }, [deviceId, orientation]);
    const viewport = device.type;
    const [locale, setLocale] = useState("en");
    const [showPreview, setShowPreview] = useState(false);
    const [previewDeviceId, setPreviewDeviceId] = useState(getLegacyPreset("desktop").id);
    const [runTour, setRunTour] = useState(false);
    const previewDevice = useMemo(() => devicePresets.find((d) => d.id === previewDeviceId) ??
        devicePresets[0], [previewDeviceId]);
    const previewViewport = previewDevice.type;
    const { viewportStyle: previewViewportStyle, frameClass: previewFrameClass, } = useViewport(previewDevice);
    const [publishCount, setPublishCount] = useState(0);
    const prevId = useRef(page.id);
    const pathname = usePathname() ?? "";
    const shop = useMemo(() => getShopFromPath(pathname), [pathname]);
    const { dragOver, setDragOver, handleFileDrop, progress, isValid, } = useFileDrop({ shop: shop ?? "", dispatch });
    const canvasRef = useRef(null);
    const tourSteps = useMemo(() => [
        {
            target: "[data-tour='palette']",
            content: "Drag components from the palette onto the canvas.",
        },
        {
            target: "[data-tour='canvas']",
            content: "Arrange and edit components on the canvas.",
        },
        {
            target: "[data-tour='sidebar']",
            content: "Edit the selected component's settings in this sidebar.",
        },
    ], []);
    const handleTourCallback = useCallback((data) => {
        if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
            setRunTour(false);
            if (typeof window !== "undefined") {
                localStorage.setItem("page-builder-tour", "done");
            }
        }
    }, []);
    useEffect(() => {
        if (typeof window !== "undefined" &&
            !localStorage.getItem("page-builder-tour")) {
            setRunTour(true);
        }
    }, []);
    const [toast, setToast] = useState({
        open: false,
        message: "",
    });
    const [showGrid, setShowGrid] = useState(false);
    const [gridSize, setGridSize] = useState(1);
    const [snapPosition, setSnapPosition] = useState(null);
    const [autoSaveState, setAutoSaveState] = useState("idle");
    const saveDebounceRef = useRef(null);
    const initialRender = useRef(true);
    const { sensors, handleDragStart, handleDragMove, handleDragEnd, insertIndex, activeType, } = usePageBuilderDnD({
        components,
        dispatch,
        defaults: defaults,
        containerTypes: CONTAINER_TYPES,
        selectId: setSelectedId,
        gridSize,
        canvasRef,
        setSnapPosition,
    });
    const handleAddFromPalette = useCallback((type) => {
        const isContainer = CONTAINER_TYPES.includes(type);
        const component = {
            id: ulid(),
            type,
            ...(defaults[type] ?? {}),
            ...(isContainer ? { children: [] } : {}),
        };
        dispatch({ type: "add", component });
        setSelectedId(component.id);
    }, [dispatch, setSelectedId]);
    const { viewportStyle, frameClass } = useViewport(device);
    useEffect(() => {
        if (showGrid && canvasRef.current) {
            setGridSize(canvasRef.current.offsetWidth / gridCols);
        }
        else {
            setGridSize(1);
        }
    }, [showGrid, device, gridCols]);
    useEffect(() => {
        const idChanged = prevId.current !== page.id;
        if (publishCount > 0 || idChanged) {
            clearHistory();
        }
        if (idChanged) {
            prevId.current = page.id;
        }
    }, [page.id, publishCount, clearHistory]);
    const formData = useMemo(() => {
        const fd = new FormData();
        fd.append("id", page.id);
        fd.append("updatedAt", page.updatedAt);
        fd.append("slug", page.slug);
        fd.append("status", page.status);
        fd.append("title", JSON.stringify(page.seo.title));
        fd.append("description", JSON.stringify(page.seo.description ?? {}));
        fd.append("components", JSON.stringify(components));
        fd.append("history", JSON.stringify(state));
        return fd;
    }, [page, components, state]);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);
    const handleAutoSave = useCallback(() => {
        setAutoSaveState("saving");
        onSave(formData)
            .then(() => {
            setAutoSaveState("saved");
            setTimeout(() => setAutoSaveState("idle"), 1000);
        })
            .catch(() => {
            setAutoSaveState("error");
            setToast({
                open: true,
                message: "Auto-save failed. Click to retry.",
                retry: () => {
                    setToast((t) => ({ ...t, open: false }));
                    handleAutoSave();
                },
            });
        });
    }, [onSave, formData]);
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        if (saveDebounceRef.current) {
            clearTimeout(saveDebounceRef.current);
        }
        saveDebounceRef.current = window.setTimeout(handleAutoSave, 2000);
        return () => {
            if (saveDebounceRef.current) {
                clearTimeout(saveDebounceRef.current);
            }
        };
    }, [handleAutoSave, components, state]);
    const handlePublish = useCallback(() => {
        return onPublish(formData).then(() => setPublishCount((c) => c + 1));
    }, [onPublish, formData]);
    return (_jsxs("div", { className: "flex gap-4", style: style, children: [_jsx(Joyride, { steps: tourSteps, run: runTour, continuous: true, showSkipButton: true, callback: handleTourCallback, styles: { options: { zIndex: 10000 } } }), _jsx("aside", { className: "w-48 shrink-0", "data-tour": "palette", children: _jsx(Palette, { onAdd: handleAddFromPalette }) }), _jsxs("div", { className: "flex flex-1 flex-col gap-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(PageToolbar, { viewport: viewport, deviceId: deviceId, setDeviceId: setDeviceId, orientation: orientation, setOrientation: setOrientation, locale: locale, setLocale: setLocale, locales: locales, progress: progress, isValid: isValid, showGrid: showGrid, toggleGrid: () => setShowGrid((g) => !g), gridCols: gridCols, setGridCols: setGridCols }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setRunTour(true), children: "Tour" }), _jsx(Button, { variant: "outline", onClick: () => setShowPreview((p) => !p), children: showPreview ? "Hide preview" : "Show preview" })] })] }), _jsx("div", { "aria-live": "polite", role: "status", className: "sr-only", children: liveMessage }), _jsxs("div", { className: "flex flex-1 gap-4", children: [_jsxs(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragStart: handleDragStart, onDragMove: handleDragMove, onDragEnd: handleDragEnd, children: [_jsx("div", { className: `${frameClass[viewport]} shrink-0`, style: viewportStyle, "data-tour": "canvas", children: _jsx(PageCanvas, { components: components, selectedId: selectedId, onSelectId: setSelectedId, canvasRef: canvasRef, dragOver: dragOver, setDragOver: setDragOver, onFileDrop: handleFileDrop, insertIndex: insertIndex, dispatch: dispatch, locale: locale, containerStyle: { width: "100%" }, showGrid: showGrid, gridCols: gridCols, viewport: viewport, device: device, snapPosition: snapPosition }) }), _jsx(DragOverlay, { children: activeType && (_jsx("div", { className: "pointer-events-none rounded border bg-muted px-4 py-2 opacity-50 shadow", children: activeType })) })] }), showPreview && (_jsxs("div", { className: "flex flex-col gap-2 shrink-0", children: [_jsx(DeviceSelector, { deviceId: previewDeviceId, onChange: setPreviewDeviceId, showLegacyButtons: true }), _jsx("div", { className: `${previewFrameClass[previewViewport]} shrink-0`, style: previewViewportStyle, children: _jsx(DynamicRenderer, { components: components, locale: locale }) })] }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: () => dispatch({ type: "undo" }), disabled: !state.past.length, children: "Undo" }), _jsx(Button, { onClick: () => dispatch({ type: "redo" }), disabled: !state.future.length, children: "Redo" }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { onClick: () => onSave(formData), disabled: saving, children: saving ? _jsx(Spinner, { className: "h-4 w-4" }) : "Save" }), autoSaveState === "saving" && (_jsxs("div", { className: "flex items-center gap-1 text-sm text-muted-foreground", children: [_jsx(Spinner, { className: "h-4 w-4" }), " Saving\u2026"] })), autoSaveState === "saved" && (_jsxs("div", { className: "flex items-center gap-1 text-sm text-muted-foreground", children: [_jsx(CheckIcon, { className: "h-4 w-4 text-green-500" }), " All changes saved"] }))] }), saveError && (_jsx("p", { className: "text-sm text-red-500", children: saveError }))] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx(Button, { variant: "outline", onClick: handlePublish, disabled: publishing, "data-tour": "publish", children: publishing ? _jsx(Spinner, { className: "h-4 w-4" }) : "Publish" }), publishError && (_jsx("p", { className: "text-sm text-red-500", children: publishError }))] })] })] }), _jsx(PageSidebar, { components: components, selectedId: selectedId, dispatch: dispatch }), _jsx(Toast, { open: toast.open, onClose: () => setToast((t) => ({ ...t, open: false })), onClick: toast.retry, message: toast.message })] }));
});
export default PageBuilder;
