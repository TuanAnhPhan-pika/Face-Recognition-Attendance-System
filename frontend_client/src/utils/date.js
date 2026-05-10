export function getLocalYMD(dateString) {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getWeekString(dateObj) {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function formatDateValue(type, dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");

  if (type === "day" || type === "range" || type === "date") return `${yyyy}-${mm}-${dd}`;
  if (type === "week") return getWeekString(dateObj);
  if (type === "month") return `${yyyy}-${mm}`;
  if (type === "year") return String(yyyy);
  return `${yyyy}-${mm}`;
}

export function inputTypeForFilter(type) {
  if (type === "day" || type === "range") return "date";
  if (type === "week") return "week";
  if (type === "month") return "month";
  if (type === "year") return "number";
  return "month";
}

export function isLateAttendance(time) {
  const d = new Date(time);
  return d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0);
}
