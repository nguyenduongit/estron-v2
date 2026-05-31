import { createClient } from '@supabase/supabase-js';
import { getEstronMonthRange, formatLocalDateStr } from './dateUtils';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xcojffehtxhxnqkiggzo.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2pmZmVodHhoeG5xa2lnZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODAxNjEsImV4cCI6MjA2MDA1NjE2MX0.sEC_zq4IeYyAQn_AC8IG7Qd189ePi7O3oNHYrogDa2k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Tra cứu người dùng bằng số điện thoại
 */
export const loginUser = async (phone: string) => {
    if (!phone) return null;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone.trim())
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("loginUser error:", error);
        throw error;
    }
};

/**
 * Đăng ký người dùng mới
 */
export const registerUser = async (name: string, phone: string) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert({
                name: name.trim(),
                phone: phone.trim()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("registerUser error:", error);
        throw error;
    }
};

/**
 * Lấy dữ liệu định mức (dinh_muc) và sản lượng (san_luong) của người dùng
 * Thực hiện truy vấn song song (Promise.all) để tối ưu thời gian phản hồi
 */
export const fetchUserData = async (user: { id: string, name: string, phone: string }, targetDate: Date = new Date()) => {
    if (!user || !user.id) return null;

    try {
        const { startDate, endDate } = getEstronMonthRange(targetDate);
        const startDateStr = formatLocalDateStr(startDate);
        const endDateStr = formatLocalDateStr(endDate);

        // Fetch dinh_muc and san_luong in parallel using Promise.all
        const [dinhMucResult, sanLuongResult] = await Promise.all([
            supabase
                .from('dinh_muc')
                .select('cong_doan_data')
                .eq('user_id', user.id)
                .maybeSingle(),
            supabase
                .from('san_luong')
                .select('ngay_lam_viec, chi_tiet_san_luong')
                .eq('user_id', user.id)
                .gte('ngay_lam_viec', startDateStr)
                .lte('ngay_lam_viec', endDateStr)
        ]);

        if (dinhMucResult.error) throw dinhMucResult.error;
        if (sanLuongResult.error) throw sanLuongResult.error;

        const congDoan = dinhMucResult.data?.cong_doan_data || [];
        
        const nangSuat: Record<string, any> = {};
        sanLuongResult.data?.forEach((row: any) => {
            nangSuat[row.ngay_lam_viec] = row.chi_tiet_san_luong;
        });

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
 * Sử dụng hàm RPC save_user_data_transactional để lưu dạng giao dịch ACID (Database transaction).
 * Nếu RPC chưa được thiết lập trên database, hàm tự động fallback sang lưu song song client-side.
 */
export const saveUserData = async (user: { id: string, name: string, phone: string }, data: any) => {
    if (!user || !user.id) throw new Error("Thông tin người dùng không hợp lệ");

    const congDoanData = data.congDoan || null;
    const sanLuongRows = data.nangSuat && Object.keys(data.nangSuat).length > 0
        ? Object.entries(data.nangSuat).map(([dateStr, detail]) => ({
            ngay_lam_viec: dateStr,
            chi_tiet_san_luong: detail
          }))
        : [];

    try {
        // Gọi hàm RPC trên Supabase để thực hiện giao dịch ghi nguyên tử
        const { error } = await supabase.rpc('save_user_data_transactional', {
            p_user_id: user.id,
            p_cong_doan_data: congDoanData,
            p_san_luong_rows: sanLuongRows
        });

        if (error) {
            // Nếu lỗi RPC chưa được tạo trong database, tự động chạy cơ chế dự phòng client-side
            if (error.code === 'P0001' || error.message.includes('function') || error.message.includes('does not exist')) {
                console.warn("RPC function save_user_data_transactional not found. Falling back to client-side saves.");
                await saveUserDataFallback(user.id, congDoanData, sanLuongRows);
            } else {
                throw error;
            }
        }
    } catch (error: any) {
        console.error("saveUserData error:", error);
        throw new Error(`Lỗi lưu dữ liệu: ${error.message}`);
    }
};

const saveUserDataFallback = async (userId: string, congDoan: any, sanLuongRows: any[]) => {
    const savePromises: Promise<any>[] = [];

    // 1. Lưu định mức
    if (congDoan) {
        const saveDinhMuc = async () => {
            const { error } = await supabase
                .from('dinh_muc')
                .upsert({
                    user_id: userId,
                    cong_doan_data: congDoan
                }, { onConflict: 'user_id' });
            if (error) throw error;
        };
        savePromises.push(saveDinhMuc());
    }

    // 2. Lưu sản lượng
    if (sanLuongRows.length > 0) {
        const saveSanLuong = async () => {
            const rows = sanLuongRows.map(row => ({
                user_id: userId,
                ngay_lam_viec: row.ngay_lam_viec,
                chi_tiet_san_luong: row.chi_tiet_san_luong
            }));

            const { error } = await supabase
                .from('san_luong')
                .upsert(rows, { onConflict: 'user_id,ngay_lam_viec' });
            if (error) throw error;
        };
        savePromises.push(saveSanLuong());
    }

    await Promise.all(savePromises);
};

/**
 * Lấy lịch trình làm việc tháng (lich_trinh_thang) của người dùng
 * Nếu chưa có, tự động sinh ra lịch trình mặc định
 */
export const fetchMonthlySchedule = async (
    userId: string,
    estronYear: number,
    estronMonth: number,
    startDate: Date,
    endDate: Date
) => {
    if (!userId) return null;
    
    const estronMonthStr = `${estronYear}-${String(estronMonth).padStart(2, '0')}`;
    
    try {
        const { data, error } = await supabase
            .from('lich_trinh_thang')
            .select('schedule_data')
            .eq('user_id', userId)
            .eq('estron_month', estronMonthStr)
            .maybeSingle();

        if (error) throw error;
        
        if (data) {
            return data.schedule_data;
        }
        
        // Sinh lịch trình mặc định nếu chưa có
        const defaultSchedule = generateDefaultSchedule(startDate, endDate);
        await saveMonthlySchedule(userId, estronYear, estronMonth, defaultSchedule);
        return defaultSchedule;
    } catch (error) {
        console.error("fetchMonthlySchedule error:", error);
        return null;
    }
};

/**
 * Sinh ra lịch trình làm việc mặc định
 * T2-T6: 480 phút, T7: 240 phút, CN: "Nghỉ"
 */
const generateDefaultSchedule = (startDate: Date, endDate: Date) => {
    const schedule: Record<string, number | string> = {};
    let current = new Date(startDate);
    
    while (current <= endDate) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        const dayOfWeek = current.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
        if (dayOfWeek === 0) {
            schedule[dateStr] = "Nghỉ";
        } else if (dayOfWeek === 6) {
            schedule[dateStr] = 240;
        } else {
            schedule[dateStr] = 480;
        }
        
        current.setDate(current.getDate() + 1);
    }
    return schedule;
};

/**
 * Lưu lịch trình làm việc tháng (lich_trinh_thang) của người dùng
 */
export const saveMonthlySchedule = async (
    userId: string,
    estronYear: number,
    estronMonth: number,
    scheduleData: Record<string, number | string>
) => {
    if (!userId) throw new Error("Thông tin người dùng không hợp lệ");
    
    const estronMonthStr = `${estronYear}-${String(estronMonth).padStart(2, '0')}`;
    
    try {
        const { error } = await supabase
            .from('lich_trinh_thang')
            .upsert({
                user_id: userId,
                estron_month: estronMonthStr,
                schedule_data: scheduleData
            }, { onConflict: 'user_id,estron_month' });

        if (error) throw error;
    } catch (error) {
        console.error("saveMonthlySchedule error:", error);
        throw error;
    }
};
