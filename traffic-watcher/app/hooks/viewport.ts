"use client";

import { useState, useEffect } from "react";

interface WindowDimensions {
    width: number;
    height: number;
}

const getWindowDimensions = (): WindowDimensions => {
    const defaultDimensions = { width: 1200, height: 800 };

    if (typeof window === "undefined") {
        return defaultDimensions;
    }

    return {
        width: window.innerWidth,
        height: window.innerHeight,
    };
};

export default function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState<WindowDimensions>(
        () => getWindowDimensions()
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => {
            setWindowDimensions(getWindowDimensions());
        };

        window.addEventListener("resize", handleResize);
        // Initial call to handle any differences between SSR and client dimensions
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return windowDimensions;
}
