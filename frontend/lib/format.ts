export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat("en-US").format(new Date(date));

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value
  );
