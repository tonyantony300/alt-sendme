import { CheckCircle, ExternalLinkIcon, XCircle } from "lucide-react";
import { useTranslation } from "../../i18n/react-i18next-compat";
import { trackTransferComplete } from "../../lib/analytics";
import type { SuccessScreenProps } from "../../types/transfer";
import { Button } from "../ui/button";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "NA";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return "NA";

  const mbps = bytesPerSecond / (1024 * 1024);
  const kbps = bytesPerSecond / 1024;

  if (mbps >= 1) {
    return `${mbps.toFixed(2)} MB/s`;
  } else {
    return `${kbps.toFixed(2)} KB/s`;
  }
}

function calculateAverageSpeed(
  fileSizeBytes: number,
  durationMs: number,
): number {
  if (durationMs === 0) return 0;
  const durationSeconds = durationMs / 1000;
  return fileSizeBytes / durationSeconds;
}

export function TransferSuccessScreen({
  metadata,
  onDone,
  onOpenFolder,
}: SuccessScreenProps) {
  const wasStopped = metadata.wasStopped || false;
  const isReceiver = !!metadata.downloadPath;
  const isDirectory = metadata.pathType === "directory";
  const { t } = useTranslation();

  const handleDone = () => {
    if (!wasStopped && !isReceiver) {
      trackTransferComplete(metadata.fileSize, "sender", metadata.duration);
    }
    onDone();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 ">
      <div className="flex items-center justify-center">
        {wasStopped ? (
          <XCircle size={44} style={{ color: "rgba(239, 68, 68, 1)" }} />
        ) : (
          <CheckCircle
            size={44}
            className="text-green-500"
            style={{ color: "rgba(37, 211, 101, 1)" }}
          />
        )}
      </div>

      <div className="text-center">
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: "var(--app-main-view-fg)" }}
        >
          {wasStopped
            ? t("common:transfer.stopped")
            : t("common:transfer.complete")}
        </h2>
        <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.6)" }}>
          {wasStopped
            ? t("common:transfer.wasStopped")
            : t("common:transfer.successMessage")}
        </p>
      </div>

      <div className="bg-opacity-10 rounded-lg p-4 w-full max-w-full">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium mr-2">
              {isDirectory
                ? t("common:transfer.folder")
                : t("common:transfer.file")}
              :
            </span>
            <span
              className="text-sm truncate max-w-full"
              title={metadata.fileName}
            >
              {metadata.fileName}
            </span>
          </div>

          {metadata.downloadPath && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium mr-2">
                {t("common:transfer.downloadPath")}:
              </span>
              <span
                className="text-sm truncate max-w-full"
                title={metadata.downloadPath}
              >
                {metadata.downloadPath}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium mr-2">
              {isDirectory
                ? t("common:transfer.folderSize")
                : t("common:transfer.fileSize")}
              :
            </span>
            <span className="text-sm">
              {wasStopped ? "NA" : formatFileSize(metadata.fileSize)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium mr-2">
              {t("common:transfer.duration")}:
            </span>
            <span className="text-sm">
              {wasStopped ? "0ms" : formatDuration(metadata.duration)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium mr-2">
              {t("common:transfer.avgSpeed")}:
            </span>
            <span className="text-sm">
              {wasStopped
                ? "NA"
                : formatSpeed(
                    calculateAverageSpeed(metadata.fileSize, metadata.duration),
                  )}
            </span>
          </div>
        </div>
      </div>

      {isReceiver && onOpenFolder ? (
        <div className="flex gap-3 w-full max-w-sm">
          <Button
            type="button"
            variant="secondary"
            onClick={onOpenFolder}
            className="flex-1 "
          >
            <ExternalLinkIcon size={12} />
            {t("common:transfer.open")}
          </Button>
          <Button type="button" className="flex-1" onClick={handleDone}>
            {t("common:transfer.done")}
          </Button>
        </div>
      ) : (
        <Button type="button" className="w-full" onClick={handleDone}>
          {t("common:transfer.done")}
        </Button>
      )}
    </div>
  );
}
