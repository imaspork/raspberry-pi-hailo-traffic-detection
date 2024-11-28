export const fetchVehicleStats = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();

    if (startDate && !endDate) {
        params.append("start_date", startDate);
        params.append("end_date", startDate);
    }
    if (startDate && endDate) {
        params.append("start_date", startDate);
        params.append("end_date", endDate);
    }

    const response = await fetch(
        `https://redlightwatcher.com/py/stats?${params.toString()}`
    );
    const data = await response.json();
    return data;
};
