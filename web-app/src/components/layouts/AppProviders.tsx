import { TranslationProvider } from "@/i18n";
import { AppThemeProvider } from "../AppThemeProvider";
import { AnchoredToastProvider, ToastProvider } from "../ui/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <TranslationProvider>
            <QueryClientProvider client={queryClient}>
                <ToastProvider position="bottom-center" limit={1}>
                    <AnchoredToastProvider>
                        <AppThemeProvider>{children}</AppThemeProvider>
                    </AnchoredToastProvider>
                </ToastProvider>
            </QueryClientProvider>
        </TranslationProvider>
    );
}
