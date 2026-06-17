export function formatPrice(cents: number | undefined): string {
  if (cents === undefined) return "0.00";
  return (cents / 100).toFixed(2);
}

export function formatData(bytes: number | undefined, dataType: number | undefined): string {
  if (dataType === 2) return "Unlimited";
  if (bytes === undefined) return "0 GB";
  const gb = bytes / 1073741824;
  return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
}
