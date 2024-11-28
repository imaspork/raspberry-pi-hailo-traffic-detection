export interface VehicleStat {
    hour: string;
    total_vehicles: number;
    red_light_runners: number;
}

export interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        dataKey: string;
        payload: VehicleStat;
    }>;
    label?: string;
}

export type VehicleStatsProps = {
    vehicleStats: Array<VehicleStat>;
};

export interface PeriodStat {
    total_red_light_runners: number;
    total_vehicles: number;
}

export type ValidTimes = "today" | "yesterday" | "last_7_days" | "last_30_days";
