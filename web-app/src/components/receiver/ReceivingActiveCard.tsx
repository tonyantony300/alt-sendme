import { Square } from "lucide-react";
import { useTranslation } from "../../i18n/react-i18next-compat";
import type { TransferProgress } from "../../types/transfer";
import { TransferProgressBar } from "../common/TransferProgressBar";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface ReceivingActiveCardProps {
  isReceiving: boolean;
  isTransporting: boolean;
  isCompleted: boolean;
  ticket: string;
  transferProgress: TransferProgress | null;
  fileNames: string[];
  onReceive: () => Promise<void>;
  onStopReceiving: () => Promise<void>;
}

export function ReceivingActiveCard({
  isTransporting,
  isCompleted,
  transferProgress,
  onStopReceiving,
}: ReceivingActiveCardProps) {
  const { t } = useTranslation();

  const getStatusColor = () => {
    if (isCompleted) return "rgb(45, 120, 220)";
    if (isTransporting) return "rgba(37, 211, 101, 0.687)";
    return "#B7B7B7";
  };

  const getStatusText = () => {
    if (isCompleted) return t("common:receiver.downloadCompleted");
    if (isTransporting) return t("common:receiver.downloadingInProgress");
    return t("common:receiver.connectingToSender");
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg absolute top-0 left-0">
        <div className="flex items-center mb-2">
          <div
            className={cn(
              "relative size-2 rounded-full bg-gray-500 before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-gray-400 before:opacity-75 mr-2",

              {
                "bg-emerald-500 before:bg-emerald-400": isTransporting,
                "bg-blue-500 before:bg-blue-400":
                  !isTransporting && !isCompleted,
                "bg-green-500 before:bg-green-400": isCompleted,
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
        {t("common:receiver.keepAppOpen")}
      </p>

      {isTransporting && transferProgress && (
        <TransferProgressBar progress={transferProgress} />
      )}

      <Button
        variant={"destructive-outline"}
        size="icon-lg"
        type="button"
        onClick={onStopReceiving}
        className="absolute top-0 right-6 rounded-full"
        aria-label="Stop receiving"
      >
        <Square className="w-4 h-4" fill="currentColor" />
      </Button>
    </div>
  );
}
