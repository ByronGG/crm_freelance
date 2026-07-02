/** Inicio del día de hoy (00:00:00 hora del servidor). */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Fin del día de hoy (23:59:59.999 hora del servidor). */
export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
