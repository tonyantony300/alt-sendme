import { create } from 'zustand'
import type { AlertDialogState, AlertType } from '../types/ui'
import type { TransferMetadata, TransferProgress } from '../types/transfer'

// Define explicit view states for predictable UI rendering
export type SenderViewState = 'IDLE' | 'SHARING' | 'TRANSPORTING' | 'SUCCESS'

export interface SenderStore {
    // View state (replaces isSharing, isTransporting, isCompleted)
    viewState: SenderViewState

    // Transfer data
    ticket: string | null
    selectedPath: string | null
    pathType: 'file' | 'directory' | null
    transferMetadata: TransferMetadata | null
    transferProgress: TransferProgress | null

    // UI flags
    isLoading: boolean
    copySuccess: boolean
    isBroadcastMode: boolean
    alertDialog: AlertDialogState

    // Actions
    setViewState: (state: SenderViewState) => void
    setTicket: (ticket: string | null) => void
    setSelectedPath: (path: string | null) => void
    setPathType: (type: 'file' | 'directory' | null) => void
    setTransferMetadata: (metadata: TransferMetadata | null) => void
    setTransferProgress: (progress: TransferProgress | null) => void
    setIsLoading: (loading: boolean) => void
    setCopySuccess: (success: boolean) => void
    setIsBroadcastMode: (enabled: boolean) => void
    toggleBroadcastMode: () => void
    setAlertDialog: (dialog: AlertDialogState) => void
    showAlert: (title: string, description: string, type?: AlertType) => void
    closeAlert: () => void

    // Complex state transitions
    resetToIdle: () => void
    resetForBroadcast: () => void
}

export const useSenderStore = create<SenderStore>()((set) => ({
    // Initial state
    viewState: 'IDLE',
    ticket: null,
    selectedPath: null,
    pathType: null,
    transferMetadata: null,
    transferProgress: null,
    isLoading: false,
    copySuccess: false,
    isBroadcastMode: false,
    alertDialog: {
        isOpen: false,
        title: '',
        description: '',
        type: 'info',
    },

    // Simple setters
    setViewState: (viewState) => set({ viewState }),
    setTicket: (ticket) => set({ ticket }),
    setSelectedPath: (selectedPath) => set({ selectedPath }),
    setPathType: (pathType) => set({ pathType }),
    setTransferMetadata: (transferMetadata) => set({ transferMetadata }),
    setTransferProgress: (transferProgress) => set({ transferProgress }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setCopySuccess: (copySuccess) => set({ copySuccess }),
    setIsBroadcastMode: (isBroadcastMode) => set({ isBroadcastMode }),
    toggleBroadcastMode: () => set((state) => ({ isBroadcastMode: !state.isBroadcastMode })),
    setAlertDialog: (alertDialog) => set({ alertDialog }),

    showAlert: (title, description, type = 'info') =>
        set({
            alertDialog: {
                isOpen: true,
                title,
                description,
                type,
            },
        }),

    closeAlert: () =>
        set((state) => ({
            alertDialog: {
                ...state.alertDialog,
                isOpen: false,
            },
        })),

    // Complex state transitions
    resetToIdle: () =>
        set({
            viewState: 'IDLE',
            ticket: null,
            selectedPath: null,
            pathType: null,
            transferMetadata: null,
            transferProgress: null,
            isLoading: false,
        }),

    resetForBroadcast: () =>
        set({
            viewState: 'SHARING',
            transferMetadata: null,
            transferProgress: null,
        }),
}))
