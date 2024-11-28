"use client";

import React, { useEffect, useState } from "react";
import "./VideoFeed.global.scss";
import { Emphasis } from "../Text/Text";
import Spinner from "@/components/ui/spinner";
import { useVideoFeed } from "./hooks";

const VideoFeed: React.FC = () => {
    const { imageSrc, metadata, isConnected } = useVideoFeed();

    return (
        <div className="relative w-full h-full">
            {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="flex flex-col justify-center items-center">
                        <Spinner variant="orbit" />
                        <Emphasis>Establishing websocket...</Emphasis>
                    </div>
                </div>
            )}
            {imageSrc && (
                <img
                    src={imageSrc}
                    alt="Video Feed"
                    className="w-full h-auto max-w-[640px]"
                />
            )}

            {!imageSrc && isConnected && (
                <div className="w-full h-64 flex items-center justify-center">
                    Loading video feed...
                </div>
            )}

            <h2 className="text-lg font-semibold my-2">Raw data</h2>
            <pre>
                <code>{JSON.stringify(metadata, null, 2)}</code>
            </pre>
        </div>
    );
};

export default VideoFeed;
