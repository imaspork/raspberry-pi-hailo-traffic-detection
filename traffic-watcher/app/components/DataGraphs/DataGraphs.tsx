"use client";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { useState } from "react";
import { fetchVehicleStats } from "../UserPanel/UserPanel.helpers";
import AnimatedNumbers from "react-animated-numbers";
import {
    CustomTooltipProps,
    PeriodStat,
    ValidTimes,
    VehicleStat,
    VehicleStatsProps,
} from "./DataGraphs.interface";

const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 p-3 border border-gray-600 rounded">
                <p className="text-gray-300">{`Time: ${label}`}</p>
                <p className="text-purple-400">
                    {`${payload[0].value.toFixed(2)} vehicles seen`}
                </p>
                <p className="text-green-400">
                    {`${payload[1].value.toFixed(1)} violators this hour`}
                </p>
            </div>
        );
    }
    return null;
};

const DataGraphs: React.FC<VehicleStatsProps> = ({ vehicleStats }) => {
    const [vehicleStatsDynamic, setVehicleStatsDynamic] =
        useState<VehicleStat[]>(vehicleStats);

    const [periodStats, setPeriodStats] = useState<PeriodStat>({
        total_red_light_runners: 0,
        total_vehicles: 0,
    });

    const handleDateRangeSelection = async (value: ValidTimes) => {
        const today = dayjs().format("YYYY-MM-DD");
        const Yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        const lastWeek = dayjs().subtract(7, "day").format("YYYY-MM-DD");
        const lastMonth = dayjs().subtract(30, "day").format("YYYY-MM-DD");

        let startDate: string = today;
        let endDate: string = today;

        switch (value) {
            case "today":
                startDate = today;
                endDate = today;
                break;
            case "yesterday":
                startDate = Yesterday;
                endDate = Yesterday;
                break;
            case "last_7_days":
                startDate = lastWeek;
                endDate = today;
                break;
            case "last_30_days":
                startDate = lastMonth;
                endDate = today;
                break;
        }

        const newVehicleStatsByQuery = await fetchVehicleStats(
            startDate,
            endDate
        );
        setVehicleStatsDynamic(newVehicleStatsByQuery.hourly_stats);
        setPeriodStats(newVehicleStatsByQuery.summary);
    };

    return (
        <div className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <div className="text-white text-xl mb-2 flex items-center gap-2">
                        Violators:{" "}
                        <AnimatedNumbers
                            includeComma
                            transitions={(index) => ({
                                type: "spring",
                                duration: index,
                            })}
                            animateToNumber={
                                periodStats.total_red_light_runners
                            }
                        />
                    </div>
                    <div className="text-white text-xl mb-2 flex items-center gap-2">
                        Vehicles Seen:{" "}
                        <AnimatedNumbers
                            includeComma
                            transitions={(index) => ({
                                type: "spring",
                                duration: index,
                            })}
                            animateToNumber={periodStats.total_vehicles}
                        />
                    </div>

                    <div className="text-gray-400 text-xs">
                        Red light violations scaled for visibility
                    </div>
                </div>
                <Select onValueChange={handleDateRangeSelection}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Data range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="last_7_days">
                                Last 7 Days
                            </SelectItem>
                            <SelectItem value="last_30_days">
                                Last 30 Days
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={vehicleStatsDynamic}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#444"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="hour"
                        stroke="#666"
                        tick={{ fill: "#666" }}
                        tickSize={8}
                    />
                    {/* Main Y-axis for vehicles */}
                    <YAxis
                        yAxisId="vehicles"
                        domain={[
                            0,
                            vehicleStats.reduce(
                                (max, obj) =>
                                    obj.total_vehicles > max
                                        ? obj.total_vehicles
                                        : max,
                                -Infinity
                            ) * 1.2,
                        ]}
                        stroke="#8884d8"
                        tick={{ fill: "#8884d8 " }}
                        tickSize={8}
                        tickFormatter={(value) => value.toFixed(1)}
                    />
                    {/* Secondary Y-axis for amplified offenders */}
                    <YAxis
                        yAxisId="offenders"
                        orientation="right"
                        domain={[
                            0,
                            vehicleStats.reduce(
                                (max, obj) =>
                                    obj.red_light_runners > max
                                        ? obj.red_light_runners
                                        : max,
                                -Infinity
                            ) * 1.2,
                        ]}
                        stroke="##4ade80"
                        tick={{ fill: "#4ade80" }}
                        tickSize={8}
                        tickFormatter={(value) => value.toFixed(1)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        wrapperStyle={{
                            color: "#fff",
                        }}
                    />
                    <Line
                        dot={false}
                        yAxisId="vehicles"
                        type="monotone"
                        dataKey="total_vehicles"
                        name="Vehicles Seen"
                        stroke="#8884d8"
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        dot={false}
                        yAxisId="offenders"
                        type="monotone"
                        dataKey="red_light_runners"
                        name="Red Light Offenders"
                        stroke="#4ade80"
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DataGraphs;
