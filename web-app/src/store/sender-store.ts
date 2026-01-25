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
    activeConnectionCount: number

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
    setActiveConnectionCount: (count: number) => void
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
    activeConnectionCount: 0,
    alertDialog: {
        isOpen: false,
        title: '',
        description: '',
        type: 'info',
    },

    // console.log('[Store] setViewState called:', {
    //     from: currentState.viewState,
    //     to: viewState,
    //     caller,
    //     hasTransferMetadata: !!currentState.transferMetadata,
    //     selectedPath: currentState.selectedPath,
    //     isBroadcastMode: currentState.isBroadcastMode,
    // })
    // const caller = stack?.split('\n')[2]?.trim() || 'unknown'
    // const currentState = useSenderStore.getState()
    // Simple setters
    // const stack = new Error().stack
    setViewState: (viewState) => {
        set({ viewState })
    },
    setTicket: (ticket) => set({ ticket }),
    setSelectedPath: (selectedPath) => set({ selectedPath }),
    setPathType: (pathType) => set({ pathType }),
    setTransferMetadata: (transferMetadata) => {
        // const stack = new Error().stack
        // const caller = stack?.split('\n')[2]?.trim() || 'unknown'
        // const currentState = useSenderStore.getState()
        // console.log('[Store] setTransferMetadata called:', {
        //     caller,
        //     hasMetadata: !!transferMetadata,
        //     metadata: transferMetadata ? { fileName: transferMetadata.fileName, wasStopped: transferMetadata.wasStopped } : null,
        //     currentViewState: currentState.viewState,
        //     selectedPath: currentState.selectedPath,
        // })
        set({ transferMetadata })
    },
    setTransferProgress: (transferProgress) => set({ transferProgress }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setCopySuccess: (copySuccess) => set({ copySuccess }),
    setIsBroadcastMode: (isBroadcastMode) => set({ isBroadcastMode }),
    toggleBroadcastMode: () => set((state) => ({ isBroadcastMode: !state.isBroadcastMode })),
    setAlertDialog: (alertDialog) => set({ alertDialog }),
    setActiveConnectionCount: (activeConnectionCount) => set({ activeConnectionCount }),

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
    resetToIdle: () => {
        // const stack = new Error().stack
        // const caller = stack?.split('\n')[2]?.trim() || 'unknown'
        // const currentState = useSenderStore.getState()
        // console.log('[Store] resetToIdle called:', {
        //     caller,
        //     previousViewState: currentState.viewState,
        //     hadTransferMetadata: !!currentState.transferMetadata,
        //     selectedPath: currentState.selectedPath,
        // })
        set({
            viewState: 'IDLE',
            ticket: null,
            selectedPath: null,
            pathType: null,
            transferMetadata: null,
            transferProgress: null,
            isLoading: false,
            isBroadcastMode: false,
            activeConnectionCount: 0,
        })
    },

    resetForBroadcast: () => {
        // const stack = new Error().stack
        // const caller = stack?.split('\n')[2]?.trim() || 'unknown'
        // const currentState = useSenderStore.getState()
        // console.log('[Store] resetForBroadcast called:', {
        //     caller,
        //     previousViewState: currentState.viewState,
        //     hadTransferMetadata: !!currentState.transferMetadata,
        // })
        set({
            viewState: 'SHARING',
            transferMetadata: null,
            transferProgress: null,
            activeConnectionCount: 0,
        })
    },
}))
