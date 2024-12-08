export interface MemoryUsage {
    total: number;
    used: number;
    free: number;
}

export interface SystemDetails {
    cpuTemp: number;
    cpuUsage: string[]; // Changed to match actual return type
    memoryUsage: MemoryUsage;
}

export interface SystemDetailsProps {
    systemInfo: SystemDetails; // Reuse the SystemDetails interface
}
