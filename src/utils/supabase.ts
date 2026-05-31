import { getEstronMonthRange, formatLocalDateStr } from './dateUtils';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xcojffehtxhxnqkiggzo.supabase.co/rest/v1';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2pmZmVodHhoeG5xa2lnZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODAxNjEsImV4cCI6MjA2MDA1NjE2MX0.sEC_zq4IeYyAQn_AC8IG7Qd189ePi7O3oNHYrogDa2k';

const getHeaders = (additionalHeaders: Record<string, string> = {}) => {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...additionalHeaders
    };
};

/**
 * Tra cứu người dùng bằng số điện thoại
 */
export const loginUser = async (phone: string) => {
    if (!phone) return null;
    const url = `${SUPABASE_URL}/users?phone=eq.${encodeURIComponent(phone.trim())}`;
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
        }
        const data = await res.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error("loginUser error:", error);
        throw error;
    }
};

/**
 * Đăng ký người dùng mới
 */
export const registerUser = async (name: string, phone: string) => {
    const url = `${SUPABASE_URL}/users`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: getHeaders({
                'Prefer': 'return=representation'
            }),
            body: JSON.stringify({
                name: name.trim(),
                phone: phone.trim()
            })
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
        }
        const data = await res.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error("registerUser error:", error);
        throw error;
    }
};

/**
 * Lấy dữ liệu định mức (dinh_muc) và sản lượng (san_luong) của người dùng
 */
export const fetchUserData = async (user: { id: string, name: string, phone: string }, targetDate: Date = new Date()) => {
    if (!user || !user.id) return null;

    try {
        // 1. Fetch quota (dinh_muc)
        const dinhMucUrl = `${SUPABASE_URL}/dinh_muc?user_id=eq.${user.id}`;
        const dinhMucRes = await fetch(dinhMucUrl, {
            method: 'GET',
            headers: getHeaders()
        });
        
        let congDoan: any[] = [];
        if (dinhMucRes.ok) {
            const data = await dinhMucRes.json();
            if (data.length > 0) {
                congDoan = data[0].cong_doan_data || [];
            }
        }

        // 2. Fetch production data (san_luong) for the current Estron month range
        const { startDate, endDate } = getEstronMonthRange(targetDate);
        const startDateStr = formatLocalDateStr(startDate);
        const endDateStr = formatLocalDateStr(endDate);
        
        const sanLuongUrl = `${SUPABASE_URL}/san_luong?user_id=eq.${user.id}&ngay_lam_viec=gte.${startDateStr}&ngay_lam_viec=lte.${endDateStr}`;
        const sanLuongRes = await fetch(sanLuongUrl, {
            method: 'GET',
            headers: getHeaders()
        });

        const nangSuat: Record<string, any> = {};
        if (sanLuongRes.ok) {
            const data = await sanLuongRes.json();
            data.forEach((row: any) => {
                nangSuat[row.ngay_lam_viec] = row.chi_tiet_san_luong;
            });
        }

        return {
            congDoan,
            nangSuat
        };
    } catch (error) {
        console.error("fetchUserData error:", error);
        return null;
    }
};

/**
 * Lưu dữ liệu định mức (dinh_muc) và sản lượng (san_luong) của người dùng
 */
export const saveUserData = async (user: { id: string, name: string, phone: string }, data: any) => {
    if (!user || !user.id) throw new Error("Thông tin người dùng không hợp lệ");

    // 1. Lưu định mức (congDoan) vào bảng dinh_muc
    if (data.congDoan) {
        const url = `${SUPABASE_URL}/dinh_muc?on_conflict=user_id`;
        const res = await fetch(url, {
            method: 'POST',
            headers: getHeaders({
                'Prefer': 'resolution=merge-duplicates'
            }),
            body: JSON.stringify({
                user_id: user.id,
                cong_doan_data: data.congDoan
            })
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Lỗi lưu định mức: ${errText}`);
        }
    }

    // 2. Lưu sản lượng (nangSuat) vào bảng san_luong
    if (data.nangSuat && Object.keys(data.nangSuat).length > 0) {
        const url = `${SUPABASE_URL}/san_luong?on_conflict=user_id,ngay_lam_viec`;
        const rows = Object.entries(data.nangSuat).map(([dateStr, detail]) => ({
            user_id: user.id,
            ngay_lam_viec: dateStr,
            chi_tiet_san_luong: detail
        }));

        const res = await fetch(url, {
            method: 'POST',
            headers: getHeaders({
                'Prefer': 'resolution=merge-duplicates'
            }),
            body: JSON.stringify(rows)
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Lỗi lưu sản lượng: ${errText}`);
        }
    }
};
