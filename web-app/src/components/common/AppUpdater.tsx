import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogClose,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
// import { useTranslation } from '@/i18n'

export function AppUpdater() {
    const [isOpen, setIsOpen] = useState(false)
    const [newVersion, setNewVersion] = useState<string>('')
    // TODO: translation support to be implemented
    // const { t } = useTranslation()

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                const update = await check()
                if (update?.available) {
                    console.log(
                        `Update to ${update.version} available! Date: ${update.date}`
                    )
                    console.log(`Release notes: ${update.body}`)
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
        try {
            const update = await check()
            if (update?.available) {
                await update.downloadAndInstall()
                await relaunch()
            }
        } catch (error) {
            console.error('Failed to install update:', error)
            setIsOpen(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogClose className="absolute right-4 top-4 rounded-sm hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground opacity-70">
                    <X className="h-4 w-4" />
                </AlertDialogClose>

                <AlertDialogHeader>
                    <AlertDialogTitle>New Version Available</AlertDialogTitle>
                    <AlertDialogDescription>
                        A new version of AltSendme ({newVersion}) is available.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button onClick={handleUpdate}>Update</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
