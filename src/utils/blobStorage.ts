export const getBlobToken = () => {
    const token = process.env.EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN;
    if (!token) {
        throw new Error('Chưa cấu hình EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN');
    }
    return token;
};

export const fetchUsers = async () => {
    const token = getBlobToken();
    try {
        // Find the users.json blob URL using the List API
        const listRes = await fetch(`https://blob.vercel-storage.com/?prefix=users.json`, {
            headers: {
                'authorization': `Bearer ${token}`,
                'x-api-version': '7'
            }
        });
        
        if (!listRes.ok) {
            console.error("List users.json failed:", await listRes.text());
            return []; // Probably doesn't exist yet
        }

        const data = await listRes.json();
        const userBlob = data.blobs.find((b: any) => b.pathname === 'users.json');

        if (!userBlob) {
            return []; // File doesn't exist yet
        }

        // Fetch the actual JSON content
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
    const response = await fetch(`https://blob.vercel-storage.com/users.json`, {
        method: 'PUT',
        headers: {
            'authorization': `Bearer ${token}`,
            'x-api-version': '7',
            'x-content-type': 'application/json',
            'x-access': 'public',
            'x-add-random-suffix': 'false' // Very important to overwrite the same file!
        },
        body: JSON.stringify(users)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    return await response.json();
};
