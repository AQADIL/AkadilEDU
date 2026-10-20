export function formatDuration(value, t) {
  const totalMinutes = Math.round(Number(value));
  if (!Number.isSafeInteger(totalMinutes) || totalMinutes <= 0) return null;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return t('duration.hoursAndMinutes', { hours, minutes });
  if (hours) return t('duration.hoursOnly', { hours });
  return t('duration.minutesOnly', { minutes });
}
