// Closing Times are always shown in Korea time: the Vercel server runs in UTC.
const format = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatClosingTime(closesAt: string) {
  const parts = Object.fromEntries(format.formatToParts(new Date(closesAt)).map((p) => [p.type, p.value]));
  return `${parts.month} ${parts.day}일 ${parts.hour}:${parts.minute}`;
}

export function closingLabel({ closed, closesAt }: { closed: boolean; closesAt: string }) {
  return closed ? `마감됨 · ${formatClosingTime(closesAt)}` : `마감: ${formatClosingTime(closesAt)}`;
}
