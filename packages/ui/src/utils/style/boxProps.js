import * as React from "react";
export function boxProps({ width, height, padding, margin }) {
    const classes = [];
    const style = {};
    if (width !== undefined) {
        if (typeof width === "string" && width.startsWith("w-")) {
            classes.push(width);
        }
        else {
            style.width = width;
        }
    }
    if (height !== undefined) {
        if (typeof height === "string" && height.startsWith("h-")) {
            classes.push(height);
        }
        else {
            style.height = height;
        }
    }
    if (padding) {
        classes.push(padding);
    }
    if (margin) {
        classes.push(margin);
    }
    return { classes: classes.join(" "), style };
}
