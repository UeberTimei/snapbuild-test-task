import { ERROR_FALLBACK } from "@/shared/config";
import { ErrorBody } from "./client.types";

export async function readErrorMessage(response: Response): Promise<string> {
  const body = await response
    .json()
    .then((payload: unknown) => ErrorBody.safeParse(payload))
    .catch(() => null);

  if (body?.success) {
    const { issues, message } = body.data;
    if (issues && issues.length > 0) return issues.join("; ");
    if (message) return message;
  }

  return `${ERROR_FALLBACK.request} with ${response.status}`;
}
