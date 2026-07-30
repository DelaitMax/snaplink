import { stringify } from "csv-stringify/sync";

export function toCsv<T extends object>(rows: T[], columns: Array<keyof T>): string {
  return stringify(rows, {
    header: true,
    columns: columns as string[],
    cast: {
      date: (value) => value.toISOString(),
    },
  });
}
