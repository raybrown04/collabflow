import { Ref } from 'react';

declare module 'react-dnd' {
    // Define the DragSourceMonitor interface
    interface DragSourceMonitor<DragObject = any, DropResult = any> {
        canDrag(): boolean;
        isDragging(): boolean;
        getItemType(): string | symbol;
        getItem(): DragObject;
        getDropResult(): DropResult | null;
        didDrop(): boolean;
        getInitialClientOffset(): { x: number, y: number } | null;
        getInitialSourceClientOffset(): { x: number, y: number } | null;
        getClientOffset(): { x: number, y: number } | null;
        getDifferenceFromInitialOffset(): { x: number, y: number } | null;
        getSourceClientOffset(): { x: number, y: number } | null;
    }

    // Define the DropTargetMonitor interface
    interface DropTargetMonitor<DragObject = any, DropResult = any> {
        canDrop(): boolean;
        isOver(options?: { shallow: boolean }): boolean;
        getItemType(): string | symbol;
        getItem(): DragObject;
        getDropResult(): DropResult | null;
        didDrop(): boolean;
        getInitialClientOffset(): { x: number, y: number } | null;
        getInitialSourceClientOffset(): { x: number, y: number } | null;
        getClientOffset(): { x: number, y: number } | null;
        getDifferenceFromInitialOffset(): { x: number, y: number } | null;
        getSourceClientOffset(): { x: number, y: number } | null;
    }

    // Define the DragSourceHookSpec interface
    interface DragSourceHookSpec<DragObject, DragObjectType, CollectedProps> {
        type: DragObjectType;
        item: DragObject | (() => DragObject);
        collect?: (monitor: DragSourceMonitor<DragObject>) => CollectedProps;
        canDrag?: boolean | ((monitor: DragSourceMonitor<DragObject>) => boolean);
        begin?: (monitor: DragSourceMonitor<DragObject>) => void;
        end?: (item: DragObject, monitor: DragSourceMonitor<DragObject>) => void;
        isDragging?: (monitor: DragSourceMonitor<DragObject>) => boolean;
    }

    // Define the DropTargetHookSpec interface
    interface DropTargetHookSpec<DragObject, DropResult, CollectedProps> {
        accept: string | string[];
        drop?: (item: DragObject, monitor: DropTargetMonitor<DragObject, DropResult>) => DropResult | void;
        collect?: (monitor: DropTargetMonitor<DragObject, DropResult>) => CollectedProps;
        hover?: (item: DragObject, monitor: DropTargetMonitor<DragObject, DropResult>) => void;
        canDrop?: (item: DragObject, monitor: DropTargetMonitor<DragObject, DropResult>) => boolean;
    }

    // Define the useDrag hook
    function useDrag<DragObject = any, DropResult = any, CollectedProps = any>(
        specArg: DragSourceHookSpec<DragObject, string | symbol, CollectedProps> |
            (() => DragSourceHookSpec<DragObject, string | symbol, CollectedProps>),
        deps?: any[]
    ): [CollectedProps, (element: HTMLElement | null) => void];

    // Define the useDrop hook
    function useDrop<DragObject = any, DropResult = any, CollectedProps = any>(
        specArg: DropTargetHookSpec<DragObject, DropResult, CollectedProps> |
            (() => DropTargetHookSpec<DragObject, DropResult, CollectedProps>),
        deps?: any[]
    ): [CollectedProps, (element: HTMLElement | null) => void];
}
