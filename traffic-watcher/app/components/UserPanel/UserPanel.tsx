import { getSystemDetails } from '@/app/lib/system';
import React from 'react';
import VideoFeed from '../VideoFeed/VideoFeed';
import LocalTime from '../Time/Time';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Video, Settings } from 'react-feather';
import RunnerImages from '../RunnerImages';

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

const UserPanel: React.FC = async () => {
    const systemInfo = await getSystemDetails();

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
                    <Settings />
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-card rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Violators / year</h2>
                        <select className="bg-gray-700 rounded px-2 py-1 text-sm">
                            <option>Last 28 days</option>
                        </select>
                    </div>
                    <div className="h-48">
                        <div className="flex items-end justify-between h-full">
                            {monthlyStats.map((stat, index) => (
                                <div key={index} className="flex flex-col items-center w-full px-4">
                                    <div
                                        className="w-8 bg-blue-500 rounded-t"
                                        style={{ height: `${stat.count * 20}%` }}
                                    ></div>
                                    <span className="text-xs text-gray-400 mt-2">{stat.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 mt-6 pt-6 border-t border-gray-700">
                        <div>
                            <h3 className="text-2xl font-bold">5.24M</h3>
                            <p className="text-xs text-gray-400">Total Cars Seen</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">194k</h3>
                            <p className="text-xs text-gray-400">Total Lights Ran</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-red-400">+2%</h3>
                            <p className="text-xs text-gray-400">VS LAST MONTH</p>
                        </div>
                    </div>
                </div>

                {/* Verified Songs */}
                <div className="bg-card rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold"><LocalTime /></h2>
                        <Video />
                    </div>
                    <div className="space-y-4 h-full">
                        <VideoFeed />
                    </div>
                </div>
            </div>

            {/* Certification Progress */}
            <div className="mt-6 bg-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">System Info</h2>
                    <HardDrive />

                </div>
                <div className="grid grid-cols-5 gap-4">
                    {systemInfo.cpuUsage.map((usage, index) => (
                        <div key={index} className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-2">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-accent"
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${parseFloat(usage) * 1.76} 176`}
                                        className="text-accent-foreground"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-sm">
                                    {usage}%
                                </span>
                            </div>
                            <span className="text-sm text-gray-400">Core {index}</span>
                        </div>

                    ))}
                    <div className="space-y-2">
                        {[
                            ["CPU Temperature", `${systemInfo.cpuTemp.toFixed(1)}°C`],
                        ].map(([label, value]) => (
                            <div key={24} className="text-center">
                                <div className="relative w-16 h-16 mx-auto mb-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-accent"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${parseFloat(value) * 1.76} 176`}
                                            className="text-accent-foreground"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-sm">
                                        {value}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-400">CPU Temp</span>
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
            <h3 className="text-lg font-semibold text-foreground text-center  my-4">Red Light Runners</h3>
            <RunnerImages />
        </div>
    );
};

export default UserPanel;