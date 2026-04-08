import { HTTPError } from "ky";

export async function getApiErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const payload = (await error.response.clone().json()) as { error?: string; message?: string };
      return payload.error || payload.message || fallback;
    } catch {
      return fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
