import { SystemDetailsProps } from "@/app/interfaces/system";
import React from "react";

const SystemInfo: React.FC<SystemDetailsProps> = ({ systemInfo }) => {
    return (
        <div className="flex flex-col gap-8">
            {systemInfo.cpuUsage.map((usage, index) => (
                <div key={index} className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-2">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-accent"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${
                                    parseFloat(usage) * 2.26
                                } 226`}
                                className="text-accent-foreground"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                            {usage}%
                        </span>
                    </div>
                    <span className="text-sm text-gray-400">
                        Core {index + 1}
                    </span>
                </div>
            ))}
            <div className="space-y-2">
                {[
                    ["CPU Temperature", `${systemInfo.cpuTemp.toFixed(1)}°C`],
                ].map(([label, value]) => (
                    <div key={24} className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-2">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-accent"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${
                                        parseFloat(value) * 2.26
                                    } 226`}
                                    className="text-accent-foreground"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                                {value}
                            </span>
                        </div>
                        <span className="text-sm text-gray-400">CPU Temp</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SystemInfo;
