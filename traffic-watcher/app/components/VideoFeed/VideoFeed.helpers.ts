import { FrameMetaData } from "./VideoFeed.interface";

export const handleWebSocketMessage = (
    event: MessageEvent,
    previousObjectUrl: string | null,
    setImageSrc: (src: string) => void,
    setMetadata: (metadata: FrameMetaData) => void
) => {
    try {
        const data = JSON.parse(event.data);
        setMetadata(data.metadata);

        const frameData = atob(data.frame);
        const frameArray = new Uint8Array(frameData.length);
        for (let i = 0; i < frameData.length; i++) {
            frameArray[i] = frameData.charCodeAt(i);
        }

        const imageBlob = new Blob([frameArray], { type: "image/jpeg" });
        const objectUrl = URL.createObjectURL(imageBlob);

        if (previousObjectUrl) {
            URL.revokeObjectURL(previousObjectUrl);
        }

        setImageSrc(objectUrl);
        return objectUrl;
    } catch (error) {
        console.error("Error processing message:", error);
        console.error("Raw message data:", event.data);
        return previousObjectUrl;
    }
};
