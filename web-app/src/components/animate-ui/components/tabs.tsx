import {
	TabsContent as TabsContentPrimitive,
	type TabsContentProps as TabsContentPrimitiveProps,
	TabsContents as TabsContentsPrimitive,
	type TabsContentsProps as TabsContentsPrimitiveProps,
	TabsHighlightItem as TabsHighlightItemPrimitive,
	TabsHighlight as TabsHighlightPrimitive,
	TabsList as TabsListPrimitive,
	type TabsListProps as TabsListPrimitiveProps,
	Tabs as TabsPrimitive,
	type TabsProps as TabsPrimitiveProps,
	TabsTrigger as TabsTriggerPrimitive,
	type TabsTriggerProps as TabsTriggerPrimitiveProps,
} from '@/components/animate-ui/primitives/radix/tabs'
import { cn } from '@/lib/utils'

type TabsProps = TabsPrimitiveProps

function Tabs({ className, ...props }: TabsProps) {
	return (
		<TabsPrimitive
			className={cn('flex flex-col gap-2', className)}
			{...props}
		/>
	)
}

type TabsListProps = TabsListPrimitiveProps

function TabsList({ className, ...props }: TabsListProps) {
	return (
		<TabsHighlightPrimitive className="absolute z-0 inset-0 border border-transparent rounded-md bg-background dark:border-input dark:bg-input/30 shadow-sm">
			<TabsListPrimitive
				className={cn(
					'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
					className
				)}
				{...props}
			/>
		</TabsHighlightPrimitive>
	)
}

type TabsTriggerProps = TabsTriggerPrimitiveProps

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
	return (
		<TabsHighlightItemPrimitive value={props.value} className="flex-1">
			<TabsTriggerPrimitive
				className={cn(
					"data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md w-full px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-500 ease-in-out focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
					className
				)}
				{...props}
			/>
		</TabsHighlightItemPrimitive>
	)
}

type TabsContentsProps = TabsContentsPrimitiveProps

function TabsContents(props: TabsContentsProps) {
	return <TabsContentsPrimitive {...props} />
}

type TabsContentProps = TabsContentPrimitiveProps

function TabsContent({ className, ...props }: TabsContentProps) {
	return (
		<TabsContentPrimitive
			className={cn('flex-1 outline-none', className)}
			{...props}
		/>
	)
}

export {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContents,
	TabsContent,
	type TabsProps,
	type TabsListProps,
	type TabsTriggerProps,
	type TabsContentsProps,
	type TabsContentProps,
}
