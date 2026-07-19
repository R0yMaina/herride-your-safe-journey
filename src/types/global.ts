export type ID = string;
export type ISODateString = string;
export interface Paginated<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
export type AsyncStatus = "idle" | "loading" | "success" | "error";
export type UserRole = "passenger" | "driver" | "admin";
