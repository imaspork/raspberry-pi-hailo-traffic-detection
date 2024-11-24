"use client";

import styles from './DataGraphs.module.scss';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const DataGraphs: React.FC<{ vehicleStats: { hour: string, total_vehicles: number, red_light_runners: number }[] }> = ({ vehicleStats }) => {
    //     const formatYAxis = (value: number) => {
    //         return (value / 1000).toFixed(1);
    //     };

    //     return (
    //         <div className="w-full p-4">
    //             <div className="text-white text-xl mb-2">Violators / year</div>
    //             <ResponsiveContainer width="100%" height={400}>
    //                 <LineChart
    //                     data={vehicleStats}
    //                     margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
    //                 >
    //                     <CartesianGrid
    //                         strokeDasharray="3 3"
    //                         stroke="#444"
    //                         vertical={false}
    //                     />
    //                     <XAxis
    //                         dataKey="hour"
    //                         stroke="#666"
    //                         tick={{ fill: '#666' }}
    //                         tickSize={8}
    //                     />
    //                     <YAxis
    //                         domain={[0, 1]}
    //                         ticks={[0.0, 0.2, 0.4, 0.6, 0.8, 1.0]}
    //                         stroke="#666"
    //                         tick={{ fill: '#666' }}
    //                         tickSize={8}
    //                         tickFormatter={formatYAxis}
    //                     />
    //                     <Tooltip
    //                         contentStyle={{
    //                             backgroundColor: '#1a1a1a',
    //                             border: '1px solid #666',
    //                             color: '#fff',
    //                             borderRadius: '4px'
    //                         }}
    //                     />
    //                     <Legend
    //                         verticalAlign="top"
    //                         height={36}
    //                         wrapperStyle={{
    //                             color: '#fff'
    //                         }}
    //                     />
    //                     <Line
    //                         type="monotone"
    //                         dataKey="total_vehicles"
    //                         name="Vehicles Seen"
    //                         stroke="#8884d8"
    //                         dot={{ fill: '#8884d8', r: 4 }}
    //                         activeDot={{ r: 6 }}
    //                     />
    //                     <Line
    //                         type="monotone"
    //                         dataKey="red_light_runners"
    //                         name="Red Light Offenders"
    //                         stroke="#4ade80"
    //                         dot={{ fill: '#4ade80', r: 4 }}
    //                         activeDot={{ r: 6 }}
    //                     />
    //                 </LineChart>
    //             </ResponsiveContainer>
    //         </div>
    //     );
    // };

    // export default DataGraphs

    interface VehicleStats {
        hour: string;
        total_vehicles: number;
        red_light_runners: number;
    }

    interface CustomTooltipProps {
        active?: boolean;
        payload?: Array<{
            value: number;
            dataKey: string;
            payload: VehicleStats;
        }>;
        label?: string;
    }

    const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 p-3 border border-gray-600 rounded">
                    <p className="text-gray-300">{`Time: ${label}`}</p>
                    <p className="text-purple-400">
                        {`${payload[0].value.toFixed(2)} vehicles seen`}
                    </p>
                    <p className="text-green-400">
                        {`${(payload[1].value).toFixed(1)} violators this hour`}
                    </p>
                </div>
            );
        }
        return null;
    };

    console.log((vehicleStats.reduce((max, obj) => (obj.total_vehicles > max ? obj.total_vehicles : max), -Infinity)) / 1000);

    return (
        <div className="w-full p-4">
            <div className="text-white text-xl mb-2">Violators</div>
            <div className="text-gray-400 text-xs">Red light violations scaled for visibility</div>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={vehicleStats}
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
                        tick={{ fill: '#666' }}
                        tickSize={8}
                    />
                    {/* Main Y-axis for vehicles */}
                    <YAxis
                        yAxisId="vehicles"
                        domain={[0, ((vehicleStats.reduce((max, obj) => (obj.total_vehicles > max ? obj.total_vehicles : max), -Infinity)) * 1.2)]}
                        stroke="#8884d8"
                        tick={{ fill: '#8884d8 ' }}
                        tickSize={8}
                        tickFormatter={(value) => (value).toFixed(1)}
                    />
                    {/* Secondary Y-axis for amplified offenders */}
                    <YAxis
                        yAxisId="offenders"
                        orientation="right"
                        domain={[0, (vehicleStats.reduce((max, obj) => (obj.red_light_runners > max ? obj.red_light_runners : max), -Infinity) * 1.2)]}
                        stroke="##4ade80"
                        tick={{ fill: '#4ade80' }}
                        tickSize={8}
                        tickFormatter={(value) => (value).toFixed(1)}

                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        wrapperStyle={{
                            color: '#fff'
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