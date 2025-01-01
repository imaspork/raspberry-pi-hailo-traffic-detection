import React from "react";
import { HardDrive } from "react-feather";
import RunnerImages from "../RunnerImages/RunnerImages";
import DataGraphs from "../DataGraphs/DataGraphs";
import { fetchVehicleStats } from "./UserPanel.helpers";
import FeedGrid from "../FeedGrid/FeedGrid";
import { Progress } from "@/components/ui/progress";
import SystemInfo from "../SystemInfo/SystemInfo";
import { getSystemDetails } from "@/lib/system";

export const dynamic = "force-dynamic";

const UserPanel: React.FC = async () => {
    const systemInfo = await getSystemDetails();
    const vehicleData = await fetchVehicleStats("2024-11-10", "2024-11-27");

    return (
        <div className="bg-gray-900 text-white p-6 min-h-screen rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Data & Analytics</h1>
                    <p className="text-gray-400 text-sm">
                        Plot different data points to analyze this intersecion
                    </p>
                </div>
                <div className="flex items-center gap-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="client-feed col-span-4">
                    <FeedGrid />
                </div>
                <div className="bg-card rounded-xl p-6 col-span-1">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">
                            Raspberry Pi 5 System Info
                        </h2>
                    </div>
                    <SystemInfo systemInfo={systemInfo} />

                    <h3 className="text-lg font-semibold text-foreground mt-4">
                        Memory Usage
                    </h3>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                            {systemInfo.memoryUsage.used.toFixed(2)} /{" "}
                            {systemInfo.memoryUsage.total.toFixed(2)} GB
                        </span>
                    </div>
                    <Progress
                        value={
                            (systemInfo.memoryUsage.used /
                                systemInfo.memoryUsage.total) *
                            100
                        }
                        className="h-2 mt-4"
                    />
                </div>
            </div>

            <div className="mt-6 bg-card rounded-xl p-6">
                <div className="h-[500px]">
                    <DataGraphs vehicleStats={vehicleData.hourly_stats} />
                </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground text-center  my-4">
                Red Light Runners
            </h3>
            <RunnerImages />
        </div>
    );
};

export default UserPanel;
