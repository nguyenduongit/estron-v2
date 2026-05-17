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
    const newUrl = `https://${storeId}.public.blob.vercel-storage.com/users/users.json?t=${Date.now()}`;
    const oldUrl = `https://${storeId}.public.blob.vercel-storage.com/users.json?t=${Date.now()}`;
    
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
    const filename = 'users/users.json';
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

export const fetchUserData = async (phone: string) => {
    const token = getBlobToken();
    if (!token) return null;
    
    const storeId = token.split('_')[3];
    const newUrl = `https://${storeId}.public.blob.vercel-storage.com/data/user_data_${phone}.json?t=${Date.now()}`;
    const oldUrl = `https://${storeId}.public.blob.vercel-storage.com/user_data_${phone}.json?t=${Date.now()}`;
    
    try {
        let res = await fetch(newUrl, { cache: 'no-store' });
        if (!res.ok) {
            // Fallback to old path
            res = await fetch(oldUrl, { cache: 'no-store' });
            if (!res.ok) return null;
        }

        return await res.json();
    } catch (error) {
        console.error("fetchUserData error:", error);
        return null;
    }
};

export const saveUserData = async (phone: string, data: any) => {
    const token = getBlobToken();
    const filename = `data/user_data_${phone}.json`;
    
    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
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
