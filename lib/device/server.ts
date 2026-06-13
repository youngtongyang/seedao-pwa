import { headers } from "next/headers";
import type { Device } from "./index";

const MOBILE_UA = /Mobi|Android|iPhone|iPod|Windows Phone|webOS|BlackBerry/i;

/**
 * Best-effort device guess from the request User-Agent, used to pick the
 * correct component system on the very first server render (no flash for the
 * common case). The client {@link DeviceProvider} corrects it after mount.
 */
export async function getInitialDevice(): Promise<Device> {
  const ua = (await headers()).get("user-agent") ?? "";
  return MOBILE_UA.test(ua) ? "mobile" : "desktop";
}
