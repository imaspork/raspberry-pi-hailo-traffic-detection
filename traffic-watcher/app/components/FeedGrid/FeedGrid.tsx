"use client";

import { Video } from "react-feather";
import LocalTime from "../Time/Time";
import PersistentGraphPopover from "../InteractiveGraph/InteractiveGraph";
import { useRef, useState } from "react";
import styles from "./FeedGrid.module.scss";
import { motion, useAnimationControls } from "framer-motion";
import { putInMotionHandler } from "./FeedGrid.handler";

const FeedGrid: React.FC = () => {
    const [openVertices, setOpenVertices] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isActive, setIsActive] = useState<boolean>(false);
    const controls = useAnimationControls();
    const originalWidth = useRef<number>(0);

    return (
        <div>
            <div
                onClick={() => {
                    putInMotionHandler(
                        openVertices,
                        setOpenVertices,
                        isActive,
                        setIsActive,
                        controls,
                        containerRef,
                        originalWidth
                    );
                }}
                className={`${styles.blackout} ${
                    isActive ? styles.trigger : ""
                }`}
            ></div>
            <motion.div
                ref={containerRef}
                animate={controls}
                className={styles.animationContainer}
                transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                    mass: 0.5,
                }}
            >
                <div className="bg-card rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">
                            <LocalTime />
                        </h2>
                        <Video />
                    </div>
                    <div className="h-full relative videoFeedContainer">
                        <PersistentGraphPopover
                            putInMotionHandler={() => {
                                putInMotionHandler(
                                    openVertices,
                                    setOpenVertices,
                                    isActive,
                                    setIsActive,
                                    controls,
                                    containerRef,
                                    originalWidth
                                );
                            }}
                            openVertices={openVertices}
                            setOpenVertices={setOpenVertices}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default FeedGrid;
