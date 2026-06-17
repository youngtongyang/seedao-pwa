"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import {
  useAccount as useWagmiAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  WagmiProvider,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { registerExistingSns } from "@/lib/auth/phone";
import { useT } from "@/lib/i18n";
import { getWalletConfig } from "@/lib/wallet/config";
import { getNonce, verifySns } from "@/lib/wallet/client";
import {
  currentDomain,
  PhoneCodeFields,
  useAuthSuccess,
  useErrorText,
  usePhoneCode,
} from "./login-shared";

/**
 * Self-contained "I already hold an on-chain SNS" flow. This is the ONLY place
 * the wagmi stack is mounted — it's loaded lazily (see the dynamic import in
 * `login-panel.tsx`) so the rest of the app never pulls it in.
 *
 * Browser-wallet (injected) only: no WalletConnect/Reown. The wallet nonce is
 * single-use (45s TTL), so verifying ownership and registering each need their
 * own fresh nonce + signature (two prompts).
 */
function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function ConnectControl() {
  const t = useT();
  const { address, isConnected } = useWagmiAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0]; // the single injected connector

  if (isConnected && address) {
    return (
      <div className="flex items-center justify-center gap-3">
        <span className="rounded-xl border border-border bg-muted px-3 py-2 font-mono text-sm">
          {shortAddress(address)}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => disconnect()}>
          {t.login.walletDisconnect}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="w-full"
        disabled={isPending || !connector}
        onClick={() => connector && connect({ connector })}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
        {isPending ? t.login.walletConnecting : t.login.walletConnect}
      </Button>
      {error && <p className="text-xs text-destructive">{t.login.walletNoWallet}</p>}
    </div>
  );
}

function JoinWallet() {
  const t = useT();
  const pc = usePhoneCode();
  const errorText = useErrorText();
  const onSuccess = useAuthSuccess();
  const { address, isConnected } = useWagmiAccount();
  const { signMessageAsync } = useSignMessage();

  const [claimable, setClaimable] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A fresh nonce → signature pair (each is single-use, 45s TTL).
  async function sign(): Promise<{ message: string; signature: string } | { error: string }> {
    if (!address) return { error: errorText("wallet_verify_failed") };
    const domain = currentDomain();
    const nonce = await getNonce(address, domain);
    if (!nonce.ok) return { error: errorText(nonce.error) };
    try {
      const signature = await signMessageAsync({ message: nonce.data.message });
      return { message: nonce.data.message, signature };
    } catch {
      return { error: t.login.walletSignRejected };
    }
  }

  async function handleVerify() {
    setError(null);
    setClaimable(null);
    setVerifying(true);
    try {
      const signed = await sign();
      if ("error" in signed) return setError(signed.error);
      const result = await verifySns({
        wallet: address!,
        domain: currentDomain(),
        message: signed.message,
        signature: signed.signature,
      });
      if (!result.ok) return setError(errorText(result.error));
      if (!result.data.claimable) return setError(errorText("wallet_no_sns"));
      setClaimable(result.data.sns_name);
    } finally {
      setVerifying(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pc.phoneOk) return setError(t.login.invalidPhone);
    if (!pc.codeOk) return setError(t.login.invalidCode);
    setBusy(true);
    try {
      const signed = await sign(); // fresh signature — the verify nonce was consumed
      if ("error" in signed) return setError(signed.error);
      const result = await registerExistingSns({
        phone: pc.phone,
        code: pc.code,
        wallet: address!,
        domain: currentDomain(),
        message: signed.message,
        signature: signed.signature,
      });
      if (result.ok) onSuccess(result.user);
      else setError(errorText(result.error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 text-center">
      <p className="text-sm text-muted-foreground">{t.login.walletConnectHint}</p>
      <ConnectControl />

      {isConnected && !claimable && (
        <Button type="button" size="lg" className="w-full" disabled={verifying} onClick={handleVerify}>
          {verifying ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
          {verifying ? t.login.walletVerifying : t.login.walletVerifyCta}
        </Button>
      )}

      {claimable && (
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <p className="flex items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="size-4" /> {t.login.walletClaimable(claimable)}
          </p>
          <p className="text-xs text-muted-foreground">{t.login.walletTwoSignNote}</p>
          <PhoneCodeFields pc={pc} />
          <Button type="submit" size="lg" className="w-full" disabled={busy || !pc.phoneOk || !pc.codeOk}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {busy ? t.login.joining : t.login.joinCta}
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** Mounts the wagmi providers around the wallet flow. Default export so it can be
 *  `next/dynamic`-imported (client-only) by the login panel. */
export default function WalletLogin() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={getWalletConfig()}>
      <QueryClientProvider client={queryClient}>
        <JoinWallet />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
