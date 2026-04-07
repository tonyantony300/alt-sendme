import {
	DefaultFileIcon,
	DocIcon,
	FolderIcon,
	ImageIcon,
	JsonIcon,
	PdfIcon,
	PptIcon,
	TxtIcon,
	XlsxIcon,
	ZipIcon,
} from '@/components/illustration'
import { Film } from 'lucide-react'
import type { ReactElement } from 'react'

const BASE_ICON_CLASS = 'scale-60 origin-center'

export function getPreviewFileIcon(
	mimeType?: string,
	fileName?: string
): ReactElement {
	const ext = fileName?.split('.').pop()?.toLowerCase() || ''
	if (
		mimeType?.includes('word') ||
		mimeType?.includes('document') ||
		['doc', 'docx'].includes(ext)
	) {
		return <DocIcon size="md" className={BASE_ICON_CLASS} />
	}
	if (
		mimeType?.includes('sheet') ||
		mimeType?.includes('excel') ||
		mimeType?.includes('csv') ||
		['xls', 'xlsx', 'csv'].includes(ext)
	) {
		return <XlsxIcon size="md" className={BASE_ICON_CLASS} />
	}
	if (
		mimeType?.includes('presentation') ||
		mimeType?.includes('powerpoint') ||
		['ppt', 'pptx'].includes(ext)
	) {
		return <PptIcon size="md" className={BASE_ICON_CLASS} />
	}
	if (mimeType === 'application/pdf' || ext === 'pdf') {
		return <PdfIcon size="md" className={BASE_ICON_CLASS} />
	}
	if (mimeType === 'application/json' || ext === 'json') {
		return <JsonIcon size="md" className={BASE_ICON_CLASS} />
	}
	if (mimeType?.startsWith('text/') || ext === 'txt') {
		return <TxtIcon size="md" className={BASE_ICON_CLASS} />
	}
	if (
		mimeType?.includes('zip') ||
		mimeType?.includes('tar') ||
		mimeType?.includes('rar') ||
		mimeType?.includes('7z') ||
		mimeType?.includes('gzip') ||
		['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
	) {
		return <ZipIcon size="md" className={BASE_ICON_CLASS} />
	}
	if (mimeType === 'inode/directory') {
		return <FolderIcon size="md" className={BASE_ICON_CLASS} />
	}

	if (mimeType === 'application/x-iroh-collection') {
		return <FolderIcon size="md" className={BASE_ICON_CLASS} />
	}

	// When image thumbnail fails to load, fallback to generic image icon.
	if (mimeType?.startsWith('image/')) {
		return <ImageIcon size="md" className={`${BASE_ICON_CLASS} mt-1`} />
	}

	if (
		mimeType?.startsWith('video/') ||
		['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(ext)
	) {
		return <Film className="h-16 w-16 text-muted-foreground" />
	}

	return <DefaultFileIcon size="md" className={BASE_ICON_CLASS} />
}
