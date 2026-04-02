import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";

/**
 * Deep Link payload from Rust backend
 */
interface DeepLinkPayload {
  action: string;
  ticket: string | null;
  extra?: Record<string, unknown>;
}

/**
 * DeepLinkHandler Component
 * Listens for deep-link events from Rust backend and handles routing/state updates
 */
export function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let unlistenDeepLink: UnlistenFn | null = null;
    let unlistenDeepLinkError: UnlistenFn | null = null;

    const setupListeners = async () => {
      try {
        // Listen for deep-link events from Rust
        unlistenDeepLink = await listen<DeepLinkPayload>(
          "deep-link",
          (event) => {
            const payload = event.payload;
            console.log("[DeepLinkHandler] Received deep-link event:", payload);
            handleDeepLink(payload);
          },
        );

        // Listen for deep-link errors
        unlistenDeepLinkError = await listen<{
          error: string;
          url: string;
        }>("deep-link-error", (event) => {
          console.error(
            "[DeepLinkHandler] Deep link error:",
            event.payload.error,
          );
        });

        console.log("[DeepLinkHandler] Listeners initialized successfully");
      } catch (error) {
        // Silently fail if Tauri is not available (e.g. browser environment)
        console.debug(
          "[DeepLinkHandler] Note: Tauri event listener not available",
          error,
        );
      }
    };

    setupListeners();

    return () => {
      if (unlistenDeepLink) unlistenDeepLink();
      if (unlistenDeepLinkError) unlistenDeepLinkError();
    };
  }, [navigate]);

  const handleDeepLink = (payload: DeepLinkPayload) => {
    const { action, ticket } = payload;
    switch (action) {
      case "receive":
        if (ticket) {
          navigate(`/?tab=receive&ticket=${encodeURIComponent(ticket)}`);
        } else {
          navigate("/?tab=receive");
        }
        break;
      case "send":
        navigate("/?tab=send");
        break;
      default:
        console.warn(`[DeepLinkHandler] Unknown action: ${action}`);
    }
  };

  return null;
}

/**
 * DeepLinkHeader: UI Component
 * Shows a persistent notification bar when a deep link is received.
 */
export function DeepLinkHeader() {
  const [incomingPayload, setIncomingPayload] =
    useState<DeepLinkPayload | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const setup = async () => {
      try {
        const unlisten = await listen<DeepLinkPayload>("deep-link", (event) => {
          setIncomingPayload(event.payload);
        });
        return unlisten;
      } catch (e) {
        console.debug("DeepLinkHeader: Not in Tauri context", e);
      }
    };

    let unlistenFn: UnlistenFn | undefined;
    setup().then((un) => {
      unlistenFn = un;
    });

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, []);

  if (!incomingPayload) return null;

  return (
    <div className="bg-primary/10 text-primary px-4 py-2 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top duration-300 border-b border-primary/20">
      <div className="flex items-center gap-2 truncate">
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="truncate italic">
          检测到分享链接，是否进入接收页面？
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] font-bold"
          onClick={() => {
            const { action, ticket } = incomingPayload;
            if (action === "receive" && ticket) {
              navigate(`/?tab=receive&ticket=${encodeURIComponent(ticket)}`);
            } else if (action === "receive") {
              navigate("/?tab=receive");
            } else if (action === "send") {
              navigate("/?tab=send");
            }
            setIncomingPayload(null);
          }}
        >
          立即跳转
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIncomingPayload(null)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default DeepLinkHandler;
