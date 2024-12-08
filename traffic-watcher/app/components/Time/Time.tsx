"use client";

import React, { useState, useEffect } from "react";

const LocalTime: React.FC = () => {
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        // Function to format time
        const formatTime = () => {
            const now = new Date();
            return now.toLocaleString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        };

        // Set initial time
        setTime(formatTime());

        // Update time every second
        const timer = setInterval(() => {
            setTime(formatTime());
        }, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(timer);
    }, []);

    return <> {time}</>;
};

export default LocalTime;
