import { useReceiverContext } from '../components/receiver/ReceiverProvider'
import { useSenderStore } from '../store/sender-store'

/**
 * True while a transfer could be moving bytes in either direction. Restarting
 * for an update drops whatever is in flight, so the updater asks first.
 *
 * A live share with no peer attached doesn't count — the ticket survives a
 * restart being minted again, an interrupted transfer doesn't.
 */
export function useTransferBusy(): boolean {
	const { isTransporting } = useReceiverContext()
	const viewState = useSenderStore((s) => s.viewState)
	const activeConnectionCount = useSenderStore((s) => s.activeConnectionCount)

	return (
		isTransporting ||
		viewState === 'TRANSPORTING' ||
		(viewState === 'SHARING' && activeConnectionCount > 0)
	)
}
