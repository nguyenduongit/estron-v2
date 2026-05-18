export const getEstronMonthRange = (date: Date = new Date()) => {
    const currentDay = date.getDate();
    const currentMonth = date.getMonth(); // 0-11
    const currentYear = date.getFullYear();
    
    let estronMonth: number;
    let estronYear: number;
    
    if (currentDay <= 20) {
        estronMonth = currentMonth;
        estronYear = currentYear;
    } else {
        estronMonth = currentMonth + 1;
        estronYear = currentYear;
        if (estronMonth > 11) {
            estronMonth = 0;
            estronYear++;
        }
    }
    
    // Start date is 21 of previous month
    let startMonth = estronMonth - 1;
    let startYear = estronYear;
    if (startMonth < 0) {
        startMonth = 11;
        startYear--;
    }
    
    const startDate = new Date(startYear, startMonth, 21);
    const endDate = new Date(estronYear, estronMonth, 20);
    
    return {
        startDate,
        endDate,
        estronMonth: estronMonth + 1, // 1-12
        estronYear
    };
};

export const getEstronDays = (startDate: Date, endDate: Date) => {
    const days: string[] = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
        // Skip Sundays (0 is Sunday)
        if (current.getDay() !== 0) {
            // Format to UTC string part to avoid timezone shifts
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            days.push(`${yyyy}-${mm}-${dd}`);
        }
        current.setDate(current.getDate() + 1);
    }
    
    // Sort descending (latest day first)
    return days.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
};
