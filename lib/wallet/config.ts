import { createConfig, http, type Config } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * wagmi config for the "I already hold an on-chain SNS" flow.
 *
 * Browser-wallet (injected) only — no WalletConnect, so there's no Reown
 * `projectId` to configure and no cloud allowlist. `multiInjectedProviderDiscovery`
 * defaults to true, so every installed wallet announces itself via EIP-6963 and
 * shows up as its own connector (MetaMask, Rabby, OKX, …); the explicit
 * `injected()` below is only the fallback for older browsers that expose a bare
 * `window.ethereum` without EIP-6963. The wallet picker (see `wallet-login.tsx`)
 * lets the user choose among them. Built lazily (never at module import) so it
 * runs only when the wallet tab mounts; the rest of the app never touches web3.
 *
 * Signing is `personal_sign` over the SIWE message the backend builds, so the
 * connected chain doesn't gate verification; `mainnet` is here for the provider
 * only. To add mobile WalletConnect later, swap this for RainbowKit's
 * `getDefaultConfig` with a `NEXT_PUBLIC_WC_PROJECT_ID`.
 */
let cached: Config | null = null;

export function getWalletConfig(): Config {
  if (cached) return cached;
  cached = createConfig({
    chains: [mainnet],
    connectors: [injected()],
    transports: { [mainnet.id]: http() },
    ssr: false,
  });
  return cached;
}
