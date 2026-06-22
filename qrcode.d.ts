/**
 * Minimal ambient types for the `qrcode` package (it ships none, and we avoid
 * pulling in `@types/qrcode`). Covers only `toDataURL`, which is all we use to
 * render the WeChat Native `code_url` into a scannable QR on the client.
 */
declare module "qrcode" {
  export type QRCodeErrorCorrectionLevel = "low" | "medium" | "quartile" | "high" | "L" | "M" | "Q" | "H";

  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
    /** Quiet-zone width in modules. */
    margin?: number;
    /** Output image width in pixels. */
    width?: number;
    color?: { dark?: string; light?: string };
  }

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;

  const _default: { toDataURL: typeof toDataURL };
  export default _default;
}
