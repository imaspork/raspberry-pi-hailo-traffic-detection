import { getSystemDetails } from '@/app/lib/system';
import React, { useEffect, useState } from 'react';
import VideoFeed from '../VideoFeed/VideoFeed';
import LocalTime from '../Time/Time';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Video, Settings } from 'react-feather';
import RunnerImages from '../RunnerImages';
import DataGraphs from '../DataGraphs/DataGraphs';
import InteractiveGraph from '../InteractiveGraph/InteractiveGraph';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PersistentGraphPopover from '../InteractiveGraph/InteractiveGraph';
import { Button } from '@/components/ui/button';

interface SongStats {
    uniquePercentage: number;
    title: string;
    artist: string;
    waveform: string; // This would be the actual waveform data in practice
    duration: string;
}

interface ListenerStats {
    month: string;
    count: number;
}

export const dynamic = 'force-dynamic';


const fetchVehicleStats = async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`https://redlightwatcher.com/py/stats?${params.toString()}`);
    const data = await response.json();
    return data;
};



const UserPanel: React.FC = async () => {
    const systemInfo = await getSystemDetails();
    const vehicleData = await fetchVehicleStats("2024-11-01", "2024-11-25")

    const monthlyStats: ListenerStats[] = [
        { month: 'JAN', count: 2.1 },
        { month: 'FEB', count: 3.2 },

    ];

    const verifiedSongs: SongStats[] = [
        { uniquePercentage: 92, title: 'Happy', artist: 'Pharrell Williams', waveform: '', duration: '3:53' },
        { uniquePercentage: 78, title: 'Get Lucky', artist: 'Pharrell Williams', waveform: '', duration: '4:08' },
        { uniquePercentage: 89, title: 'Feels', artist: 'Pharrell Williams', waveform: '', duration: '3:44' },
    ];

    return (
        <div className="bg-gray-900 text-white p-6 min-h-screen rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Data & Analytics</h1>
                    <p className="text-gray-400 text-sm">Plot different data points to analyze this intersecion</p>
                </div>
                <div className="flex items-center gap-4">

                    {/* <PersistentGraphPopover /> */}
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-card rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">Raspberry Pi 5 System Info</h2>
                        <HardDrive />

                    </div>

                    <div className="flex flex-wrap gap-16 justify-center ">
                        {systemInfo.cpuUsage.map((usage, index) => (
                            <div key={index} className="text-center">
                                <div className="relative w-32 h-32 mx-auto mb-3">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="16"
                                            fill="none"
                                            className="text-accent"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="16"
                                            fill="none"
                                            strokeDasharray={`${parseFloat(usage) * 3.52} 352`}
                                            className="text-accent-foreground"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-base">
                                        {usage}%
                                    </span>
                                </div>
                                <span className="text-base text-gray-400">Core {index}</span>
                            </div>
                        ))}
                        <div className="space-y-3">
                            {[
                                ["CPU Temperature", `${systemInfo.cpuTemp.toFixed(1)}°C`],
                            ].map(([label, value]) => (
                                <div key={24} className="text-center">
                                    <div className="relative w-32 h-32 mx-auto mb-3">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="currentColor"
                                                strokeWidth="16"
                                                fill="none"
                                                className="text-accent"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="currentColor"
                                                strokeWidth="16"
                                                fill="none"
                                                strokeDasharray={`${parseFloat(value) * 3.52} 352`}
                                                className="text-accent-foreground"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-base">
                                            {value}
                                        </span>
                                    </div>
                                    <span className="text-base text-gray-400">CPU Temp</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mt-4">Memory Usage</h3>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{systemInfo.memoryUsage.used.toFixed(2)} / {systemInfo.memoryUsage.total.toFixed(2)} GB</span>
                    </div>
                    <Progress
                        value={(systemInfo.memoryUsage.used / systemInfo.memoryUsage.total) * 100}
                        className="h-2 mt-4"
                    />

                </div>

                {/* Verified Songs */}
                <div className="bg-card rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold"><LocalTime /></h2>
                        <Video />


                    </div>
                    <div className="h-full relative">
                        <PersistentGraphPopover />
                        <VideoFeed />


                    </div>
                </div>
            </div>

            {/* Certification Progress */}
            <div className="mt-6 bg-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Violators / year</h2>
                    <select className="bg-gray-700 rounded px-2 py-1 text-sm">
                        <option>Last 28 days</option>
                    </select>
                </div>
                <div className="h-[500px]">
                    <DataGraphs vehicleStats={vehicleData.hourly_stats} />
                </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground text-center  my-4">Red Light Runners</h3>
            <RunnerImages />

        </div>
    );
};

export default UserPanel;