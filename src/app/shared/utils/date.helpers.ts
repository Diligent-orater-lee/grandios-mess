export function isTodayDate(dateString: string | Date) {
  return new Date(dateString).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
}
