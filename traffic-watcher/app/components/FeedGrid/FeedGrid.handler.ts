import { AnimationControls } from "framer-motion";
import React, { MutableRefObject } from "react";

export const putInMotionHandler = (
    openVertices: boolean,
    setOpenVertices: React.Dispatch<React.SetStateAction<boolean>>,
    isActive: boolean,
    setIsActive: React.Dispatch<React.SetStateAction<boolean>>,
    controls: AnimationControls,
    containerRef: MutableRefObject<HTMLDivElement | null>,
    originalWidth: React.MutableRefObject<number>
) => {
    setOpenVertices(!openVertices);
    const width = window.innerWidth;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (!isActive) {
        originalWidth.current = rect.width;
    }

    const centerX = isActive
        ? 0
        : width / 2 - rect.left - (isActive ? originalWidth.current : 700) / 2;

    setIsActive(!isActive);
    controls.start({
        x: centerX,
        width: isActive ? "auto" : 700,
    });
    document.body.style.overflow = !isActive ? "hidden" : "unset";
};
