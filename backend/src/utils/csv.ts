import { stringify } from "csv-stringify/sync";

/**
 * CSV-сериализация через csv-stringify (RFC 4180: корректное экранирование
 * кавычками, запятыми, переводами строк) вместо самодельной реализации.
 */
export function toCsv<T extends object>(rows: T[], columns: Array<keyof T>): string {
  return stringify(rows, {
    header: true,
    columns: columns as string[],
    cast: {
      date: (value) => value.toISOString(),
    },
  });
}
