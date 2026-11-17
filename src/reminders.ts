import * as Notifications from 'expo-notifications';
import { reminderDates } from './rules';
import { Moment, Reminder } from './types';

/**
 * Agenda o lembrete da noite só para os próximos dias SEM moment.
 * Roda ao abrir o app, ao salvar/apagar um moment e ao mudar o ajuste.
 */
export async function syncReminders(reminder: Reminder, name: string, moments: Pick<Moment, 'date'>[]) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (reminder === 'off') return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    for (const date of reminderDates(new Date(), Number(reminder), moments)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Memora', body: `Como foi seu dia${name ? ', ' + name : ''}? A Lumi quer saber ✦` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
    }
  } catch (e) {
    console.warn('[memora/reminders]', e);
  }
}

/** Pede permissão (se precisar) e já agenda. Devolve se ficou permitido. */
export async function enableReminders(reminder: Reminder, name: string, moments: Pick<Moment, 'date'>[]) {
  if (reminder === 'off') {
    await syncReminders('off', name, moments);
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  await syncReminders(reminder, name, moments);
  return status === 'granted';
}
