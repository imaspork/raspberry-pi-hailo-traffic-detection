import { useState, useEffect } from "react";
import { FrameMetaData } from "./VideoFeed.interface";
import { handleWebSocketMessage } from "./VideoFeed.helpers";

interface VideoFeedState {
    imageSrc: string | null;
    metadata: FrameMetaData | null;
    isConnected: boolean;
}

export const useVideoFeed = (): VideoFeedState => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<FrameMetaData | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let socket: WebSocket | null = null;
        let isComponentMounted = true;
        let previousObjectUrl: string | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;

        const connectWebSocket = () => {
            if (typeof window === "undefined") return;

            socket = new WebSocket(
                `wss://${process.env.NEXT_PUBLIC_BASE_DOMAIN_URL}/py/ws`
            );

            socket.onopen = () => {
                console.log("Connected to video feed");
                setIsConnected(true);
            };

            socket.onmessage = (event: MessageEvent) => {
                if (!isComponentMounted) return;
                handleWebSocketMessage(
                    event,
                    previousObjectUrl,
                    setImageSrc,
                    setMetadata
                );
            };

            socket.onclose = (event) => {
                console.log("Connection closed with code:", event.code);
                setIsConnected(false);
                if (isComponentMounted) {
                    reconnectTimeout = setTimeout(connectWebSocket, 2000);
                }
            };

            socket.onerror = (error: Event) => {
                console.error("WebSocket error:", error);
            };
        };

        connectWebSocket();

        return () => {
            isComponentMounted = false;
            if (socket) socket.close();
            if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, []);

    return { imageSrc, metadata, isConnected };
};
