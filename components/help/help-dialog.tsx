"use client";

import { Clock, MessageCircle } from "lucide-react";
import { QRFrame } from "@/components/shared/qr-frame";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <span className="mb-1 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="size-6" />
          </span>
          <DialogTitle className="text-xl">{t.help.title}</DialogTitle>
          <DialogDescription>{t.help.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 pt-1">
          <QRFrame src="/qr/wechat-help.png" alt={t.help.qrHint} size={188} withBadge={false} />
          <p className="text-sm font-medium">{t.help.qrHint}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {t.help.responseTime}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
