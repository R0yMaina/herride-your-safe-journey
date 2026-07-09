export const formatCurrency = (amount: number, currency = "KES") =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDistance = (km: number) =>
  km >= 10 ? `${km.toFixed(0)} km` : `${km.toFixed(1)} km`;

export const formatDuration = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min} min`;

export const formatScheduledFor = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};