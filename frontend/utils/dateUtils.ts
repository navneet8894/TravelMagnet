export const toDateInput = (date: Date) => date.toISOString().split("T")[0];
export const today = () => toDateInput(new Date());
export const dayAfter = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return toDateInput(date);
};
