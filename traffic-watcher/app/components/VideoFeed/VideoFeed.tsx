"use client";

import { Progress } from '@/components/ui/progress';
import React, { useEffect, useState } from 'react';
import './VideoFeed.global.scss';
import { Emphasis, InlineCode } from '../Text/Text';
import Spinner from '@/components/ui/spinner';
import { FrameMetaData } from './VideoFeed.interface';


const VideoFeed: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FrameMetaData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isComponentMounted = true;
    let previousObjectUrl: string | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      if (typeof window === 'undefined') return;

      socket = new WebSocket('wss://redlightwatcher.com/py/ws');

      socket.onopen = () => {
        console.log('Connected to video feed');
        setIsConnected(true);
      };

      socket.onmessage = (event: MessageEvent) => {
        if (!isComponentMounted) return;

        try {
          // Directly parse the data as JSON since FastAPI sends JSON
          const data = JSON.parse(event.data);

          // Update metadata state
          setMetadata(data.metadata);

          // Convert base64 frame to blob
          const frameData = atob(data.frame);
          const frameArray = new Uint8Array(frameData.length);
          for (let i = 0; i < frameData.length; i++) {
            frameArray[i] = frameData.charCodeAt(i);
          }

          const imageBlob = new Blob([frameArray], { type: 'image/jpeg' });
          const objectUrl = URL.createObjectURL(imageBlob);

          if (previousObjectUrl) {
            URL.revokeObjectURL(previousObjectUrl);
          }

          previousObjectUrl = objectUrl;
          setImageSrc(objectUrl);
        } catch (error) {
          console.error('Error processing message:', error);
          // Log the raw event data for debugging
          console.error('Raw message data:', event.data);
        }
      };

      socket.onclose = (event) => {
        console.log('Connection closed with code:', event.code);
        console.log('Reason:', event.reason);
        setIsConnected(false);
        if (isComponentMounted) {
          reconnectTimeout = setTimeout(connectWebSocket, 2000);
        }
      };

      socket.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      isComponentMounted = false;
      if (socket) {
        socket.close();
      }
      if (previousObjectUrl) {
        URL.revokeObjectURL(previousObjectUrl);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

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
      {imageSrc && <img
        src={imageSrc}
        alt="Video Feed"
        className="w-full h-auto"
      />}

      {!imageSrc && isConnected && <div className="w-full h-64 flex items-center justify-center">
        Loading video feed...
      </div>}

      <h2 className="text-lg font-semibold mt-4">Raw data</h2>
      <pre ><code>{JSON.stringify(metadata, null, 2)}</code></pre>

    </div>
  );
};

export default VideoFeed;