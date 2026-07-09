"use client";

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function WithdrawDialog({
  open,
  onOpenChange,
  onConfirm,
  withdrawing,
  variant = "draft",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  withdrawing: boolean;
  variant?: "draft";
}) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.proposals.withdraw.title}</DialogTitle>
          <DialogDescription>
            {variant === "draft" ? t.proposals.withdraw.draftDesc : t.proposals.withdraw.desc}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={withdrawing}>
            {t.common.back}
          </Button>
          <Button variant="destructive" disabled={withdrawing} onClick={onConfirm}>
            {withdrawing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t.proposals.withdraw.confirm
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
