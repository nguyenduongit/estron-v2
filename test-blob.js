require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch'); // wait, node 18+ has fetch
const token = process.env.BLOB_READ_WRITE_TOKEN;
const filename = 'users/users.json';

async function test() {
    console.log("Token:", token ? "Exists" : "Missing");
    const listRes = await fetch(`https://blob.vercel-storage.com/?prefix=${filename}`, {
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
    console.log("Blobs:", JSON.stringify(data.blobs, null, 2));
}
test();
