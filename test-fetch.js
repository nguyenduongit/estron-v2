require('dotenv').config({ path: '.env.local' });
const token = process.env.BLOB_READ_WRITE_TOKEN;
const filename = 'users/users.json';

async function test() {
    console.log("Token:", token ? "Exists" : "Missing");
    const listUrl = `https://blob.vercel-storage.com/?prefix=${filename}&t=${Date.now()}`;
    console.log("Fetching:", listUrl);
    const listRes = await fetch(listUrl, {
        headers: {
            'authorization': `Bearer ${token}`,
            'x-api-version': '7'
        }
    });
    
    if (!listRes.ok) {
        console.error("List failed:", await listRes.text());
        return;
    }
    const data = await listRes.json();
    console.log("Blobs found:", data.blobs.map(b => ({pathname: b.pathname, url: b.url})));
    
    const userBlob = data.blobs.find(b => b.pathname === filename);
    if (!userBlob) {
        console.log("userBlob not found! Looking for exactly:", filename);
        return;
    }
    console.log("Found userBlob:", userBlob.url);
    const contentRes = await fetch(`${userBlob.url}?t=${Date.now()}`);
    console.log("Content status:", contentRes.status);
    const users = await contentRes.json();
    console.log("Users:", users);
}
test();
