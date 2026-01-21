import { useEffect, useRef, useState } from "react";
import { Receiver } from "./components/receiver/Receiver";
import { Sender } from "./components/sender/Sender";
import { TitleBar } from "./components/TitleBar";
import { TranslationProvider } from "./i18n";
import { useTranslation } from "./i18n/react-i18next-compat";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./components/ui/tabs";
import { Frame, FrameHeader, FramePanel } from "./components/ui/frame";
import { AppFooter } from "./components/AppFooter";
import { AnchoredToastProvider, ToastProvider } from "./components/ui/toast";

function AppContent() {
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");
  const [isSharing, setIsSharing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const isInitialRender = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    isInitialRender.current = true;
  }, []);

  return (
    <div
      className="h-screen flex flex-col relative glass-background select-none bg-background"
      style={{ color: "var(--app-bg-fg)" }}
    >
      {IS_LINUX && <TitleBar title={t("common:appTitle")} />}

      {IS_MACOS && (
        <div className="absolute w-full h-10 z-10" data-tauri-drag-region />
      )}

      <div className="container mx-auto p-8 flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-3xl font-bold font-mono text-center mb-8 select-none [@media(min-height:680px)]:block hidden"
            style={{ color: "var(--app-bg-fg)" }}
          >
            {t("common:appTitle")}
          </h1>
          <Frame>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <FrameHeader>
                <TabsList className="w-full">
                  <TabsTab disabled={isReceiving} value="send">
                    {t("common:send")}
                  </TabsTab>
                  <TabsTab disabled={isSharing} value="receive">
                    {t("common:receive")}
                  </TabsTab>
                </TabsList>
              </FrameHeader>
              <FramePanel>
                <TabsPanel value="send">
                  <Sender onTransferStateChange={setIsSharing} />
                </TabsPanel>
                <TabsPanel value="receive">
                  <Receiver onTransferStateChange={setIsReceiving} />
                </TabsPanel>
              </FramePanel>
            </Tabs>
          </Frame>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

function App() {
  return (
    <TranslationProvider>
      <ToastProvider position="bottom-center" limit={1}>
        <AnchoredToastProvider>
          <AppContent />
        </AnchoredToastProvider>
      </ToastProvider>
    </TranslationProvider>
  );
}

export default App;
