import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { Loader2, Gift } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogContent,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

// import { useTranslation } from '@/i18n'

export function AppUpdater() {
    const [isOpen, setIsOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
     const [newVersion, setNewVersion] = useState<string>('') // kept for now in case used elsewhere
    // TODO: translation support to be implemented
    // const { t } = useTranslation()

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                const update = await check()
                if (update?.available) {
                    // console.log(
                    //     `Update to ${update.version} available! Date: ${update.date}`
                    // )
                    // console.log(`Release notes: ${update.body}`)
                    setNewVersion(update.version)
                    setIsOpen(true)
                }
            } catch (error) {
                console.error('Failed to check for updates:', error)
            }
        }

        checkUpdate()
    }, [])

    const handleUpdate = async () => {
        setIsUpdating(true)
        try {
            const update = await check()
            if (update?.available) {
                await update.downloadAndInstall()
                await relaunch()
            }
        } catch (error) {
            console.error('Failed to install update:', error)
            setIsOpen(false)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen} >
            <AlertDialogContent backdropClassName="!bg-transparent !backdrop-blur-none"
  className="fixed bottom-1 left-2 translate-x-0 translate-y-0 w-md">
                <div className="flex px-5 py-4 items-center gap-2">
                    <Gift className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm flex items-center text-muted-foreground">
                        A new version is available - {newVersion}
                    </p>
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                        >
                            Later
                        </Button>
                        <Button
                            size="sm"
                            className="w-24"
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            aria-busy={isUpdating}
                        >
                            {isUpdating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                'Update now'
                            )}
                        </Button>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}
