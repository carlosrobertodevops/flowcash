export function formatCurrency(value: string | number, currency: "BRL" | "USD" = "BRL") {
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(Number(value));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function dateInputValue(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}
