import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduleSettings {
  weekdays: number; // in minutes
  saturday: number; // in minutes
  sunday: number; // in minutes
}

export const DEFAULT_SCHEDULE: ScheduleSettings = {
  weekdays: 480,
  saturday: 240,
  sunday: 0
};

export const getScheduleSettings = async (): Promise<ScheduleSettings> => {
  try {
    const data = await AsyncStorage.getItem('work_schedule');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        weekdays: parsed.weekdays !== undefined ? Number(parsed.weekdays) : DEFAULT_SCHEDULE.weekdays,
        saturday: parsed.saturday !== undefined ? Number(parsed.saturday) : DEFAULT_SCHEDULE.saturday,
        sunday: parsed.sunday !== undefined ? Number(parsed.sunday) : DEFAULT_SCHEDULE.sunday,
      };
    }
  } catch (e) {
    console.error("Error reading schedule settings:", e);
  }
  return DEFAULT_SCHEDULE;
};

export const saveScheduleSettings = async (settings: ScheduleSettings) => {
  await AsyncStorage.setItem('work_schedule', JSON.stringify(settings));
};

export const getTargetMinutesForDate = (date: Date, settings: ScheduleSettings) => {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return settings.sunday;
  if (dayOfWeek === 6) return settings.saturday;
  return settings.weekdays;
};
