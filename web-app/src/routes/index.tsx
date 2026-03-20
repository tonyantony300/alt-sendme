import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useRef, useState } from 'react'
import * as SingleLayoutPage from '@/components/common/SingleLayoutPage'
import { Receiver } from '@/components/receiver/Receiver'
import { Sender } from '@/components/sender/Sender'
import { Frame, FrameHeader, FramePanel } from '@/components/ui/frame'
import {
	Tabs,
	TabsList,
	TabsContent,
	TabsTrigger,
} from '@/components/animate-ui/components/tabs'
import { useTranslation } from '@/i18n'
import { useSenderStore } from '@/store/sender-store'

export function IndexPage() {
	const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')
	const [isSharing, setIsSharing] = useState(false)
	const [isReceiving, setIsReceiving] = useState(false)
	const isInitialRender = useRef(false)
	const { t } = useTranslation()

	// Store actions
	const setSelectedPath = useSenderStore((state) => state.setSelectedPath)
	const setPathType = useSenderStore((state) => state.setPathType)

	useEffect(() => {
		isInitialRender.current = true

		const applyIntent = async (path: string) => {
			setActiveTab('send')
			setSelectedPath(path)
			try {
				const type = await invoke<string>('check_path_type', { path })
				setPathType(type as 'file' | 'directory')
			} catch {
				setPathType(null)
			}
		}

		invoke<string | null>('check_launch_intent')
			.then((path) => { if (path) applyIntent(path) })
			.catch((e) => console.error('Failed to check launch intent:', e))

		const unlistenPromise = listen<string>('launch-intent', (event) => {
			if (event.payload) applyIntent(event.payload)
		})

		return () => {
			unlistenPromise.then((unlisten) => unlisten())
		}
	}, [setSelectedPath, setPathType])

	// Example: Routes can be accessed at different paths
	// You can navigate using: import { useNavigate } from 'react-router-dom'
	// const navigate = useNavigate(); navigate('/send') or navigate('/receive')

	return (
		<SingleLayoutPage.SingleLayoutPage>
			<div className="max-w-2xl mx-auto w-full pt-8 sm:pt-0">
				<Frame>
					<Tabs
						value={activeTab}
						onValueChange={(v) => setActiveTab(v as 'send' | 'receive')}
					>
						<FrameHeader>
							<TabsList className="w-full">
								<TabsTrigger disabled={isReceiving} value="send">
									{t('common:send')}
								</TabsTrigger>
								<TabsTrigger disabled={isSharing} value="receive">
									{t('common:receive')}
								</TabsTrigger>
							</TabsList>
						</FrameHeader>
						<FramePanel>
							<TabsContent value="send">
								<Sender onTransferStateChange={setIsSharing} />
							</TabsContent>
							<TabsContent value="receive">
								<Receiver onTransferStateChange={setIsReceiving} />
							</TabsContent>
						</FramePanel>
					</Tabs>
				</Frame>
			</div>
		</SingleLayoutPage.SingleLayoutPage>
	)
}
