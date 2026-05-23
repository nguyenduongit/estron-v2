import { getEstronMonthRange } from './dateUtils';

export const getBlobToken = () => {
    const token = process.env.EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN;
    if (!token) {
        throw new Error('Chưa cấu hình EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN');
    }
    return token;
};

export const fetchUsers = async () => {
    const token = getBlobToken();
    if (!token) return [];
    
    const storeId = token.split('_')[3];
    const newUrl = `https://${storeId}.public.blob.vercel-storage.com/users.json?t=${Date.now()}`;
    const oldUrl = `https://${storeId}.public.blob.vercel-storage.com/users/users.json?t=${Date.now()}`;
    
    try {
        let res = await fetch(newUrl, { cache: 'no-store' });
        if (!res.ok) {
            // Fallback to old path
            res = await fetch(oldUrl, { cache: 'no-store' });
            if (!res.ok) return [];
        }
        
        const users = await res.json();
        return Array.isArray(users) ? users : [];
    } catch (error) {
        console.error("fetchUsers error:", error);
        return [];
    }
};

export const saveUsers = async (users: any[]) => {
    const token = getBlobToken();
    const filename = 'users.json';
    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
        method: 'PUT',
        headers: {
            'authorization': `Bearer ${token}`,
            'x-api-version': '7',
            'x-content-type': 'application/json',
            'x-access': 'public',
            'x-add-random-suffix': 'false'
        },
        body: JSON.stringify(users)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    return await response.json();
};

export const getUserFolder = (name: string, phone: string) => {
    const cleanName = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    const cleanPhone = phone.trim().replace(/[^0-9]/g, "");
    return `data/${cleanName}-${cleanPhone}`;
};

const fetchOldUserData = async (phone: string) => {
    const token = getBlobToken();
    if (!token) return null;
    
    const storeId = token.split('_')[3];
    const oldUrl = `https://${storeId}.public.blob.vercel-storage.com/data/user_data_${phone}.json?t=${Date.now()}`;
    const olderUrl = `https://${storeId}.public.blob.vercel-storage.com/user_data_${phone}.json?t=${Date.now()}`;
    
    try {
        let res = await fetch(oldUrl, { cache: 'no-store' });
        if (!res.ok) {
            res = await fetch(olderUrl, { cache: 'no-store' });
            if (!res.ok) return null;
        }
        return await res.json();
    } catch (error) {
        return null;
    }
};

const saveBlobFile = async (path: string, data: any) => {
    const token = getBlobToken();
    const response = await fetch(`https://blob.vercel-storage.com/${path}`, {
        method: 'PUT',
        headers: {
            'authorization': `Bearer ${token}`,
            'x-api-version': '7',
            'x-content-type': 'application/json',
            'x-access': 'public',
            'x-add-random-suffix': 'false'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }
    return await response.json();
};

export const fetchUserData = async (user: { name: string, phone: string }, targetDate: Date = new Date()) => {
    const token = getBlobToken();
    if (!token) return null;
    
    const storeId = token.split('_')[3];
    const userFolder = getUserFolder(user.name || 'user', user.phone);
    
    // 1. Fetch quota (dinh_muc.json)
    const dinhMucUrl = `https://${storeId}.public.blob.vercel-storage.com/${userFolder}/dinh_muc.json?t=${Date.now()}`;
    let congDoan: any[] = [];
    try {
        const res = await fetch(dinhMucUrl, { cache: 'no-store' });
        if (res.ok) {
            congDoan = await res.json();
        } else {
            // Fallback: If not found, check if there's old data we can migrate
            const oldData = await fetchOldUserData(user.phone);
            if (oldData) {
                congDoan = oldData.congDoan || [];
            }
        }
    } catch (error) {
        console.error("fetch dinh_muc error:", error);
    }
    
    // 2. Fetch production data (san_luong_YYYY-MM.json) for the current Estron month range
    const { startDate, endDate } = getEstronMonthRange(targetDate);
    const getYearMonthStr = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${yyyy}-${mm}`;
    };
    
    const months = Array.from(new Set([getYearMonthStr(startDate), getYearMonthStr(endDate)]));
    const nangSuat: { [key: string]: any } = {};
    
    for (const month of months) {
        const url = `https://${storeId}.public.blob.vercel-storage.com/${userFolder}/san_luong_${month}.json?t=${Date.now()}`;
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) {
                const monthData = await res.json();
                if (monthData && typeof monthData === 'object') {
                    Object.assign(nangSuat, monthData);
                }
            }
        } catch (error) {
            console.error(`fetch san_luong_${month} error:`, error);
        }
    }
    
    // If there was no data in the new structure, see if we can migrate old user data!
    if (Object.keys(nangSuat).length === 0 && congDoan.length === 0) {
        const oldData = await fetchOldUserData(user.phone);
        if (oldData) {
            console.log("Migrating old user data for phone:", user.phone);
            congDoan = oldData.congDoan || [];
            const oldNangSuat = oldData.nangSuat || {};
            const groupedByMonth: { [key: string]: any } = {};
            for (const [dateStr, dayVal] of Object.entries(oldNangSuat)) {
                const m = dateStr.substring(0, 7); // YYYY-MM
                if (!groupedByMonth[m]) groupedByMonth[m] = {};
                groupedByMonth[m][dateStr] = dayVal;
            }
            
            try {
                // Save to new structure
                await saveBlobFile(`${userFolder}/dinh_muc.json`, congDoan);
                for (const [m, mData] of Object.entries(groupedByMonth)) {
                    await saveBlobFile(`${userFolder}/san_luong_${m}.json`, mData);
                }
                console.log("Migration successful!");
            } catch (err) {
                console.error("Migration save error:", err);
            }
            
            // Assign the parsed months we wanted to return
            for (const month of months) {
                if (groupedByMonth[month]) {
                    Object.assign(nangSuat, groupedByMonth[month]);
                }
            }
        }
    }
    
    return {
        congDoan,
        nangSuat
    };
};

export const saveUserData = async (user: { name: string, phone: string }, data: any) => {
    const token = getBlobToken();
    if (!token) throw new Error("Chưa cấu hình token");
    
    const userFolder = getUserFolder(user.name || 'user', user.phone);
    const storeId = token.split('_')[3];
    
    // 1. Save congDoan to dinh_muc.json
    if (data.congDoan) {
        await saveBlobFile(`${userFolder}/dinh_muc.json`, data.congDoan);
    }
    
    // 2. Group the local nangSuat data by month
    const localNangSuat = data.nangSuat || {};
    const monthsToSave: { [key: string]: string[] } = {};
    
    for (const dateStr of Object.keys(localNangSuat)) {
        const m = dateStr.substring(0, 7); // YYYY-MM
        if (!monthsToSave[m]) monthsToSave[m] = [];
        monthsToSave[m].push(dateStr);
    }
    
    // For each month, load existing, merge, and save
    for (const [month, dates] of Object.entries(monthsToSave)) {
        const monthUrl = `https://${storeId}.public.blob.vercel-storage.com/${userFolder}/san_luong_${month}.json?t=${Date.now()}`;
        let monthData: { [key: string]: any } = {};
        
        try {
            const res = await fetch(monthUrl, { cache: 'no-store' });
            if (res.ok) {
                monthData = await res.json();
            }
        } catch (error) {
            console.error(`Error loading existing data for month ${month}:`, error);
        }
        
        // Merge local dates into monthData
        dates.forEach(dateStr => {
            monthData[dateStr] = localNangSuat[dateStr];
        });
        
        // Save back to blob
        await saveBlobFile(`${userFolder}/san_luong_${month}.json`, monthData);
    }
};
