import { useCallback, useState } from "react";
import { ulid } from "ulid";
import useFileUpload from "../../../../hooks/useFileUpload";
import { defaults } from "../defaults";
const useFileDrop = ({ shop, dispatch }) => {
    const [dragOver, setDragOver] = useState(false);
    const { onDrop, progress, isValid } = useFileUpload({
        shop,
        requiredOrientation: "landscape",
        onUploaded: (item) => {
            dispatch({
                type: "add",
                component: {
                    id: ulid(),
                    type: "Image",
                    src: item.url,
                    alt: item.altText,
                    ...(defaults.Image ?? {}),
                },
            });
        },
    });
    const handleFileDrop = useCallback((ev) => {
        setDragOver(false);
        try {
            onDrop(ev);
        }
        catch (err) {
            console.error(err);
        }
    }, [onDrop]);
    return {
        dragOver,
        setDragOver,
        handleFileDrop,
        progress,
        isValid,
    };
};
export default useFileDrop;
