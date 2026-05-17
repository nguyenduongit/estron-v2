export const getBlobToken = () => {
    const token = process.env.EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN;
    if (!token) {
        throw new Error('Chưa cấu hình EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN');
    }
    return token;
};

export const fetchUsers = async () => {
    const token = getBlobToken();
    const filename = 'users/users.json';
    try {
        const listRes = await fetch(`https://blob.vercel-storage.com/?prefix=${filename}`, {
            headers: {
                'authorization': `Bearer ${token}`,
                'x-api-version': '7'
            }
        });
        
        if (!listRes.ok) {
            console.error("List users.json failed:", await listRes.text());
            return [];
        }

        const data = await listRes.json();
        const userBlob = data.blobs.find((b: any) => b.pathname === filename);

        if (!userBlob) {
            return [];
        }

        const contentRes = await fetch(userBlob.url);
        if (!contentRes.ok) {
            return [];
        }

        const users = await contentRes.json();
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
    const filename = `data/user_data_${phone}.json`;
    
    try {
        const listRes = await fetch(`https://blob.vercel-storage.com/?prefix=${filename}`, {
            headers: {
                'authorization': `Bearer ${token}`,
                'x-api-version': '7'
            }
        });
        
        if (!listRes.ok) return null;

        const data = await listRes.json();
        const userBlob = data.blobs.find((b: any) => b.pathname === filename);

        if (!userBlob) return null;

        const contentRes = await fetch(userBlob.url);
        if (!contentRes.ok) return null;

        return await contentRes.json();
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
