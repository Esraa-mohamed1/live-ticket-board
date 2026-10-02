import { AppError } from "./app-error";

interface PgError {
  code?: string;
  message?: string;
}

export function mapPgError(error: PgError): AppError {
  if (error.code === "23505") {
    return new AppError("duplicate", "DUPLICATE_TICKET");
  }
  if (
    error.code === "P0001" &&
    error.message?.includes("rate_limit_exceeded")
  ) {
    return new AppError(
      "You have created too many tickets. Please wait a minute and try again.",
      "RATE_LIMIT_EXCEEDED"
    );
  }
  return new AppError(
    error.message ?? "An unexpected database error occurred.",
    "DB_ERROR"
  );
}
