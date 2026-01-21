import { CheckCircle, Copy, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../i18n/react-i18next-compat";
import type {
  SharingControlsProps,
  TicketDisplayProps,
} from "../../types/sender";
import { TransferProgressBar } from "../common/TransferProgressBar";
import { Button } from "../ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { toastManager } from "../ui/toast";
import { cn } from "@/lib/utils";

export function SharingActiveCard({
  selectedPath,
  pathType,
  ticket,
  copySuccess,
  transferProgress,
  isTransporting,
  isCompleted,
  isBroadcastMode,
  onCopyTicket,
  onStopSharing,
  onToggleBroadcast: _onToggleBroadcast,
}: SharingControlsProps) {
  const { t } = useTranslation();
  const onToggleBroadcast = () => {
    if (_onToggleBroadcast) {
      const toastId = crypto.randomUUID();
      _onToggleBroadcast();
      toastManager.add({
        // Reverse `isBroadcastMode` because the state has already changed
        title: !isBroadcastMode
          ? t("common:sender.broadcastMode.on.label")
          : t("common:sender.broadcastMode.off.label"),
        id: toastId,
        description: !isBroadcastMode
          ? t("common:sender.broadcastMode.on.description")
          : t("common:sender.broadcastMode.off.description"),
        type: "info",
        actionProps: {
          children: t("common:undo"),
          onClick: () => {
            _onToggleBroadcast?.();
            toastManager.close(toastId);
          },
        },
      });
    }
  };

  const getStatusColor = () => {
    if (isCompleted) return "rgb(45, 120, 220)";
    if (isTransporting) return "rgba(37, 211, 101, 0.687)";
    return "#B7B7B7";
  };

  const getStatusText = () => {
    if (isCompleted) return t("common:sender.transferCompleted");
    if (isTransporting) return t("common:sender.sharingInProgress");
    return t("common:sender.listeningForConnection");
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  const [cumulativeBytesTransferred, setCumulativeBytesTransferred] =
    useState(0);
  const [transferStartTime, setTransferStartTime] = useState<number | null>(
    null,
  );
  const previousBytesRef = useRef<number>(0);
  const maxBytesRef = useRef<number>(0);
  const isFolderTransfer = pathType === "directory" && isTransporting;

  useEffect(() => {
    if (isTransporting && pathType === "directory") {
      setCumulativeBytesTransferred(0);
      setTransferStartTime(Date.now());
      previousBytesRef.current = 0;
      maxBytesRef.current = 0;
    }
  }, [isTransporting, pathType]);

  useEffect(() => {
    if (
      isFolderTransfer &&
      typeof transferProgress?.bytesTransferred !== "undefined"
    ) {
      const currentBytes = transferProgress.bytesTransferred;
      const previousBytes = previousBytesRef.current;
      const maxBytes = maxBytesRef.current;

      if (currentBytes > maxBytes) {
        maxBytesRef.current = currentBytes;
      }

      if (
        previousBytes > 0 &&
        currentBytes < previousBytes * 0.5 &&
        maxBytes > 0
      ) {
        setCumulativeBytesTransferred((prev) => prev + maxBytes);
        maxBytesRef.current = currentBytes;
        previousBytesRef.current = currentBytes;
      } else if (currentBytes === 0 && previousBytes > 0 && maxBytes > 0) {
        setCumulativeBytesTransferred((prev) => prev + maxBytes);
        maxBytesRef.current = 0;
        previousBytesRef.current = 0;
      } else if (currentBytes > previousBytes) {
        previousBytesRef.current = currentBytes;
      } else if (
        currentBytes < previousBytes &&
        currentBytes >= previousBytes * 0.5
      ) {
        previousBytesRef.current = currentBytes;
      }
    }
  }, [isFolderTransfer, transferProgress?.bytesTransferred]);

  const totalTransferredBytes =
    isFolderTransfer && transferProgress
      ? cumulativeBytesTransferred + transferProgress.bytesTransferred
      : (transferProgress?.bytesTransferred ?? 0);

  const [calculatedSpeed, setCalculatedSpeed] = useState(0);

  useEffect(() => {
    if (isFolderTransfer && transferProgress && transferStartTime) {
      const updateSpeed = () => {
        const elapsed = (Date.now() - transferStartTime) / 1000.0;
        const speed = elapsed > 0 ? totalTransferredBytes / elapsed : 0;
        setCalculatedSpeed(speed);
      };

      updateSpeed();
      const interval = setInterval(updateSpeed, 500);
      return () => clearInterval(interval);
    } else if (transferProgress) {
      setCalculatedSpeed(transferProgress.speedBps);
    } else {
      setCalculatedSpeed(0);
    }
  }, [
    isFolderTransfer,
    transferProgress,
    transferStartTime,
    totalTransferredBytes,
  ]);

  // Calculate percentage and create progress object for folders
  const folderProgress =
    isFolderTransfer && transferProgress
      ? {
          bytesTransferred: totalTransferredBytes,
          totalBytes: transferProgress.totalBytes,
          speedBps: calculatedSpeed,
          percentage:
            transferProgress.totalBytes > 0
              ? (totalTransferredBytes / transferProgress.totalBytes) * 100
              : 0,
        }
      : null;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg absolute top-0 left-0">
        <p
          className="text-xs mb-4 max-w-120 truncate"
          style={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          <strong className="mr-1">{t("common:sender.fileLabel")}</strong>{" "}
          {selectedPath?.split("/").pop()}
        </p>

        <div className="flex items-center mb-2">
          <div
            className={cn(
              "relative size-2 rounded-full bg-gray-500 before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-gray-400 before:opacity-75 mr-2",
              {
                "bg-emerald-500 before:bg-emerald-400": isCompleted,
                "bg-blue-500 before:bg-blue-400": isTransporting,
              },
            )}
          ></div>
          <p className="text-sm font-medium" style={{ color: statusColor }}>
            {statusText}
          </p>
        </div>
      </div>

      <p
        className="text-xs text-center"
        style={{ color: "rgba(255, 255, 255, 0.7)" }}
      >
        {t("common:sender.keepAppOpen")}
      </p>

      {!isTransporting && ticket && (
        <TicketDisplay
          ticket={ticket}
          copySuccess={copySuccess}
          onCopyTicket={onCopyTicket}
          isBroadcastMode={isBroadcastMode}
          onToggleBroadcast={onToggleBroadcast}
        />
      )}

      {isTransporting &&
        transferProgress &&
        (folderProgress ? (
          <TransferProgressBar progress={folderProgress} />
        ) : (
          <TransferProgressBar progress={transferProgress} />
        ))}

      <Button
        size="icon-lg"
        type="button"
        onClick={onStopSharing}
        variant="destructive-outline"
        className="absolute top-0 right-6 rounded-full font-medium transition-colors"
        aria-label="Stop sharing"
      >
        <Square className="w-4 h-4" fill="currentColor" />
      </Button>
    </div>
  );
}

export function TicketDisplay({
  ticket,
  copySuccess,
  onCopyTicket,
  isBroadcastMode,
  onToggleBroadcast,
}: TicketDisplayProps & {
  isBroadcastMode?: boolean;
  onToggleBroadcast?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p
          className="block text-sm font-medium"
          style={{ color: "var(--app-main-view-fg)" }}
        >
          {t("common:sender.shareThisTicket")}
        </p>
        {isBroadcastMode !== undefined && onToggleBroadcast && (
          <div className="flex items-start gap-2">
            <Label htmlFor={"broadcast-toggle"}>
              {t("common:sender.broadcastMode.index")}
            </Label>
            <Switch
              checked={isBroadcastMode}
              onCheckedChange={onToggleBroadcast}
            />
          </div>
        )}
      </div>
      <InputGroup>
        <InputGroupInput type="text" value={ticket} readOnly />
        <InputGroupAddon align="inline-end">
          <Button
            type="button"
            size="icon-xs"
            onClick={onCopyTicket}
            style={{
              backgroundColor: copySuccess
                ? "var(--app-primary)"
                : "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: copySuccess
                ? "var(--app-primary-fg)"
                : "var(--app-main-view-fg)",
            }}
            title={t("common:sender.copyToClipboard")}
          >
            {copySuccess ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </InputGroupAddon>
      </InputGroup>
      <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.6)" }}>
        {t("common:sender.sendThisTicket")}
      </p>
    </div>
  );
}
