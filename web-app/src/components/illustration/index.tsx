import type { ComponentType } from 'react'
import DocIcon from './doc-file'
import XlsxIcon from './xlsx-file'
import TxtIcon from './txt-file'
import JsonIcon from './json-file'
import PptIcon from './ppt-file'
import ZipIcon from './zip-file'
import ImageIcon from './image-file'
import DefaultFileIcon from './default-file'
import PdfIcon from './pdf-file'

export {
	DocIcon,
	XlsxIcon,
	TxtIcon,
	JsonIcon,
	PptIcon,
	ZipIcon,
	ImageIcon,
	DefaultFileIcon,
	PdfIcon,
}

interface IconProps {
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

type FileIconComponent = ComponentType<IconProps>

const ICON_MAP: Record<string, FileIconComponent> = {
	// Document files
	doc: DocIcon,
	docx: DocIcon,
	txt: TxtIcon,

	// Spreadsheet files
	xls: XlsxIcon,
	xlsx: XlsxIcon,
	csv: XlsxIcon,

	// Presentation files
	ppt: PptIcon,
	pptx: PptIcon,

	// Data files
	json: JsonIcon,

	// Archive files
	zip: ZipIcon,
	rar: ZipIcon,
	'7z': ZipIcon,
	gz: ZipIcon,
	tar: ZipIcon,

	// Image files
	jpg: ImageIcon,
	jpeg: ImageIcon,
	png: ImageIcon,
	gif: ImageIcon,
	webp: ImageIcon,
	svg: ImageIcon,

	// PDF files
	pdf: PdfIcon,
}

/**
 * Get the correct file icon component based on file extension
 * @param extension - File extension (with or without dot)
 * @returns Icon component or DefaultFileIcon if extension not found
 */
export function getFileIcon(extension: string): FileIconComponent {
	const ext = extension.toLowerCase().replace(/^\./, '')
	return ICON_MAP[ext] || DefaultFileIcon
}
