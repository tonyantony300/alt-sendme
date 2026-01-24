import { SingleLayoutPage } from '@/components/common/SingleLayoutPage'
import { Receiver } from '@/components/receiver/Receiver'
import { Sender } from '@/components/sender/Sender'
import { FrameHeader, FramePanel, Frame } from '@/components/ui/frame'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { useTranslation } from '@/i18n'
import { useState, useRef, useEffect } from 'react'
export function IndexPage() {
	const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')
	const [isSharing, setIsSharing] = useState(false)
	const [isReceiving, setIsReceiving] = useState(false)
	const isInitialRender = useRef(false)
	const { t } = useTranslation()

	useEffect(() => {
		isInitialRender.current = true
	}, [])

	// Example: Routes can be accessed at different paths
	// You can navigate using: import { useNavigate } from 'react-router-dom'
	// const navigate = useNavigate(); navigate('/send') or navigate('/receive')

	return (
		<SingleLayoutPage>
			<div className="max-w-2xl mx-auto w-full">
				<Frame>
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<FrameHeader>
							<TabsList className="w-full">
								<TabsTab disabled={isReceiving} value="send">
									{t('common:send')}
								</TabsTab>
								<TabsTab disabled={isSharing} value="receive">
									{t('common:receive')}
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
		</SingleLayoutPage>
	)
}
