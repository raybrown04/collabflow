/**
 * useScrollToDate.ts
 * Updated: 2/27/2025
 * 
 * Custom hook to handle scrolling to specific dates in the events list.
 * Extracts complex scrolling logic from VirtualizedEventsList component.
 * Implements optimized scrolling with reduced retry attempts and better performance.
 * 
 * Fixes:
 * - Improved element detection with better logging
 * - Enhanced scroll position calculation with dynamic header height
 * - Optimized scroll event handling using requestAnimationFrame
 * - Fixed synchronization between calendar and events list
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { GroupedEvents } from "./useGroupedEvents";

interface UseScrollToDateProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    groupedEvents: GroupedEvents[];
    hasEventsOnDate: (date: Date) => boolean;
    onVisibleDateChange?: (date: Date, fromUserScroll?: boolean) => void;
}

export function useScrollToDate({
    containerRef,
    groupedEvents,
    hasEventsOnDate,
    onVisibleDateChange
}: UseScrollToDateProps) {
    const [isScrolling, setIsScrolling] = useState(false);
    const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);
    const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
    const [noEventsMessage, setNoEventsMessage] = useState<string | null>(null);
    const scrollAttempts = useRef(0);
    const isScrollingProgrammatically = useRef(false);
    const lastScrollTime = useRef(0);

    // Function to find a date element using multiple strategies with improved logging
    const findDateElement = useCallback((dateStr: string): HTMLElement | null => {
        if (!containerRef.current) {
            console.log(`Cannot find date element: container ref is null`);
            return null;
        }

        console.log(`Searching for element with date: ${dateStr}`);

        // Try by data-date attribute first (most specific)
        let element = containerRef.current.querySelector(`[data-date="${dateStr}"]`) as HTMLElement | null;

        // If not found, try by ID
        if (!element) {
            element = document.getElementById(`date-${dateStr}`);
            if (element) {
                console.log(`Found element for date ${dateStr} by ID`);
            }
        } else {
            console.log(`Found element for date ${dateStr} by data-date attribute`);
        }

        // If still not found, try a more general selector with all date elements
        if (!element) {
            const allDateElements = containerRef.current.querySelectorAll('[data-date]');
            console.log(`Searching through ${allDateElements.length} date elements`);

            for (const el of allDateElements) {
                if (el.getAttribute('data-date') === dateStr) {
                    element = el as HTMLElement;
                    console.log(`Found element for date ${dateStr} in general search`);
                    break;
                }
            }
        }

        if (!element) {
            console.log(`Element for date ${dateStr} not found in DOM`);
        }

        return element;
    }, [containerRef]);

    // Function to perform the actual scrolling with improved position calculation
    const performScroll = useCallback((element: HTMLElement, targetDate: Date, isTargetDate: boolean = true, dateStr: string = '') => {
        if (!containerRef.current) {
            console.log(`Cannot perform scroll: container ref is null`);
            return;
        }

        const targetDateStr = format(targetDate, "yyyy-MM-dd");
        const displayDateStr = dateStr || targetDateStr;

        // First measure the element and container positions in the viewport
        const elementRect = element.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        console.log(`Element position: top=${elementRect.top}px, height=${elementRect.height}px`);
        console.log(`Container position: top=${containerRect.top}px, height=${containerRect.height}px`);

        // Calculate how far the element is from the container's top
        const elementRelativeTop = elementRect.top - containerRect.top + containerRef.current.scrollTop;
        console.log(`Element relative top position: ${elementRelativeTop}px`);

        // Dynamically calculate header height instead of fixed 48px
        // First try to find a header element, fallback to default if not found
        const headerElement = document.querySelector('.app-header, header, .header');
        const topOffset = headerElement ? headerElement.clientHeight + 16 : 48; // Add buffer
        console.log(`Using top offset: ${topOffset}px ${headerElement ? '(dynamic)' : '(default)'}`);

        // Set flags to indicate we're programmatically scrolling
        setIsScrolling(true);
        isScrollingProgrammatically.current = true;
        console.log(`Setting isScrollingProgrammatically to true`);

        // Calculate the final scroll position based on the element's relative position
        const scrollPosition = Math.max(0, containerRef.current.scrollTop + (elementRect.top - containerRect.top - topOffset));
        console.log(`Scrolling to position: ${scrollPosition}px (current: ${containerRef.current.scrollTop}px)`);

        // Perform the scroll in one operation for better performance
        // Position the date element at the top of the viewport with the offset
        containerRef.current.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });

        // Clear any "no events" message if we're scrolling to a date with events
        if (isTargetDate) {
            setNoEventsMessage(null);
        }

        // Double-check scroll position after animation completes
        // This ensures the date is properly positioned even if the initial scroll didn't work
        setTimeout(() => {
            // If the element still exists, verify its position and adjust if needed
            if (containerRef.current && element) {
                const newElementRect = element.getBoundingClientRect();
                const newContainerRect = containerRef.current.getBoundingClientRect();
                const newPosition = newElementRect.top - newContainerRect.top;

                console.log(`Final element position after scroll: ${newPosition}px from container top (target: ${topOffset}px)`);

                // If the element is not near the top of the viewport, adjust position
                if (Math.abs(newPosition - topOffset) > 20) {
                    console.log(`Position adjustment needed, correcting scroll position`);

                    // Recalculate the scroll position based on the new measurements
                    const adjustedPosition = Math.max(0, containerRef.current.scrollTop + (newPosition - topOffset));
                    console.log(`Adjusting to position: ${adjustedPosition}px`);

                    containerRef.current.scrollTo({
                        top: adjustedPosition,
                        behavior: 'auto' // Use 'auto' for immediate correction
                    });
                }
            }

            // Reset scrolling state
            setIsScrolling(false);
            isScrollingProgrammatically.current = false;
            console.log(`Setting isScrollingProgrammatically to false after animation`);

            // Force the visible date to be the target date
            if (onVisibleDateChange) {
                console.log(`Notifying parent of visible date change to: ${format(targetDate, "yyyy-MM-dd")} (programmatic)`);
                onVisibleDateChange(targetDate, false); // false = not from user scroll
            }
        }, 400); // Slightly longer than animation duration to ensure it completes
    }, [containerRef, onVisibleDateChange]);

    // Enhanced scroll event handling using requestAnimationFrame
    const handleScroll = useCallback(() => {
        if (!onVisibleDateChange || isScrollingProgrammatically.current || !containerRef.current) return;

        // Use requestAnimationFrame for smoother detection
        requestAnimationFrame(() => {
            if (!containerRef.current) return;

            // Find all date elements
            const dateElements = containerRef.current.querySelectorAll('[data-date]');
            if (!dateElements || dateElements.length === 0) {
                console.log(`No date elements found during scroll`);
                return;
            }

            // Get container dimensions
            const containerRect = containerRef.current.getBoundingClientRect();
            const containerTop = containerRect.top + 10; // Small buffer for better detection

            // Find visible elements
            const visibleElements = Array.from(dateElements).filter(el => {
                const rect = el.getBoundingClientRect();
                // Element is visible if any part of it is in the viewport
                return rect.bottom > containerTop && rect.top < (containerTop + containerRect.height);
            });

            if (visibleElements.length === 0) {
                console.log(`No visible date elements found during scroll`);
                return;
            }

            // Find the topmost visible element
            const topElement = visibleElements.reduce((closest, current) => {
                const closestRect = closest.getBoundingClientRect();
                const currentRect = current.getBoundingClientRect();
                return (Math.abs(currentRect.top - containerTop) < Math.abs(closestRect.top - containerTop))
                    ? current : closest;
            }, visibleElements[0]);

            const dateStr = topElement.getAttribute('data-date');
            if (dateStr) {
                const visibleDate = new Date(dateStr);

                // Only update if the highlighted date is different to prevent infinite loops
                if (highlightedDate !== dateStr && !isScrolling) {
                    console.log(`Top visible date changed to: ${dateStr} (from user scroll)`);

                    // Store the date string to compare in the next render
                    const newHighlightedDate = dateStr;

                    // Update highlighted date
                    setHighlightedDate(newHighlightedDate);

                    // Notify parent component with fromUserScroll=true
                    onVisibleDateChange(visibleDate, true);
                }
            }
        });
    }, [onVisibleDateChange, isScrolling, highlightedDate, containerRef]);

    // Improved throttled scroll handler
    const throttledScrollHandler = useCallback(() => {
        if (!containerRef.current) return;

        // Throttle to max once per 75ms (more responsive than 100ms)
        const now = Date.now();
        if (now - lastScrollTime.current < 75) {
            return;
        }

        lastScrollTime.current = now;

        // Only process scroll events when not programmatically scrolling
        if (!isScrollingProgrammatically.current) {
            handleScroll();
        }
    }, [handleScroll, containerRef]);

    // Enhanced scrollToDate function with better logging and retry mechanism
    const scrollToDate = useCallback((targetDate: Date) => {
        if (!containerRef.current) {
            console.log(`Cannot scroll to date: container ref is null`);
            return;
        }

        console.log(`scrollToDate called with date: ${format(targetDate, "yyyy-MM-dd")}`);

        // Reset scroll attempts counter
        scrollAttempts.current = 0;

        // Set flags to indicate we're programmatically scrolling
        setIsScrolling(true);
        isScrollingProgrammatically.current = true;
        console.log(`Setting isScrollingProgrammatically to true`);

        // Store the target date so we can use it in handleScroll
        setLastSelectedDate(targetDate);

        // Always update the highlighted date to the selected date
        const targetDateStr = format(targetDate, "yyyy-MM-dd");
        setHighlightedDate(targetDateStr);

        // Check if the target date has events
        const hasEvents = hasEventsOnDate(targetDate);
        console.log(`Selected date ${targetDateStr} has events: ${hasEvents}`);

        // Find the date element to scroll to using multiple strategies
        const dateElement = findDateElement(targetDateStr);

        if (dateElement && hasEvents) {
            console.log(`Found element for date ${targetDateStr}, performing scroll`);
            // Use a longer delay to ensure the DOM is fully updated
            setTimeout(() => {
                performScroll(dateElement, targetDate);
            }, 50);
        } else if (!hasEvents) {
            console.log(`No events on date ${targetDateStr}, finding closest date with events`);
            // If the date doesn't have events, find the closest date with events
            const closestDateGroup = groupedEvents.reduce((closest, current) => {
                const currentDiff = Math.abs(current.date.getTime() - targetDate.getTime());
                const closestDiff = closest ? Math.abs(closest.date.getTime() - targetDate.getTime()) : Infinity;
                return currentDiff < closestDiff ? current : closest;
            }, null as GroupedEvents | null);

            if (closestDateGroup) {
                const closestDateStr = format(closestDateGroup.date, "yyyy-MM-dd");
                console.log(`Closest date with events: ${closestDateStr}`);

                // Find the element for the closest date
                const closestElement = findDateElement(closestDateStr);

                if (closestElement) {
                    // Show message that we're showing the closest date with events
                    const message = `No events on ${format(targetDate, "MMMM d, yyyy")}. Showing closest date with events.`;
                    console.log(message);
                    setNoEventsMessage(message);

                    // Scroll to the closest element
                    setTimeout(() => {
                        performScroll(closestElement, targetDate, false, closestDateStr);
                    }, 50);
                } else {
                    const message = `No events on ${format(targetDate, "MMMM d, yyyy")}. Closest date with events: ${format(closestDateGroup.date, "MMMM d, yyyy")}.`;
                    console.log(message);
                    setNoEventsMessage(message);
                    setIsScrolling(false);
                    isScrollingProgrammatically.current = false;
                    console.log(`Setting isScrollingProgrammatically to false (no element found)`);

                    // Force the visible date to be the target date even though there's nothing to scroll to
                    if (onVisibleDateChange) {
                        console.log(`Notifying parent of visible date change to: ${format(targetDate, "yyyy-MM-dd")} (no scroll)`);
                        onVisibleDateChange(targetDate, false); // false = not from user scroll
                    }
                }
            } else {
                // No events at all
                const message = `No events on ${format(targetDate, "MMMM d, yyyy")} or nearby dates.`;
                console.log(message);
                setNoEventsMessage(message);
                setIsScrolling(false);
                isScrollingProgrammatically.current = false;
                console.log(`Setting isScrollingProgrammatically to false (no events at all)`);

                // Force the visible date to be the target date even though there's nothing to scroll to
                if (onVisibleDateChange) {
                    console.log(`Notifying parent of visible date change to: ${format(targetDate, "yyyy-MM-dd")} (no events)`);
                    onVisibleDateChange(targetDate, false); // false = not from user scroll
                }
            }
        } else {
            // This case happens when the date has events but the DOM element doesn't exist yet
            console.log(`Date has events but element not found yet, will retry`);
            const message = `Loading events for ${format(targetDate, "MMMM d, yyyy")}...`;
            setNoEventsMessage(message);

            // Try multiple times with increasing delays (exponential backoff) - improved version
            const retryWithDelay = (attempt: number, maxAttempts: number, delay: number) => {
                console.log(`Retry attempt ${attempt}/${maxAttempts} with delay ${delay}ms`);

                if (attempt >= maxAttempts) {
                    console.log(`Max retry attempts reached, falling back to closest date`);
                    // Fall back to closest date with events
                    const closestDateGroup = groupedEvents.reduce((closest, current) => {
                        const currentDiff = Math.abs(current.date.getTime() - targetDate.getTime());
                        const closestDiff = closest ? Math.abs(closest.date.getTime() - targetDate.getTime()) : Infinity;
                        return currentDiff < closestDiff ? current : closest;
                    }, null as GroupedEvents | null);

                    if (closestDateGroup) {
                        const closestDateStr = format(closestDateGroup.date, "yyyy-MM-dd");
                        console.log(`Falling back to closest date: ${closestDateStr}`);
                        const closestElement = findDateElement(closestDateStr);

                        if (closestElement) {
                            const message = `Showing events for ${format(closestDateGroup.date, "MMMM d, yyyy")}.`;
                            console.log(message);
                            setNoEventsMessage(message);
                            performScroll(closestElement, targetDate, false, closestDateStr);
                        } else {
                            console.log(`Could not find element for closest date either`);
                            setIsScrolling(false);
                            isScrollingProgrammatically.current = false;
                            console.log(`Setting isScrollingProgrammatically to false (fallback failed)`);

                            if (onVisibleDateChange) {
                                console.log(`Notifying parent of visible date change to: ${format(targetDate, "yyyy-MM-dd")} (fallback)`);
                                onVisibleDateChange(targetDate, false);
                            }
                        }
                    } else {
                        console.log(`No closest date with events found`);
                        setIsScrolling(false);
                        isScrollingProgrammatically.current = false;
                        console.log(`Setting isScrollingProgrammatically to false (no fallback)`);

                        if (onVisibleDateChange) {
                            console.log(`Notifying parent of visible date change to: ${format(targetDate, "yyyy-MM-dd")} (no fallback)`);
                            onVisibleDateChange(targetDate, false);
                        }
                    }
                    return;
                }

                // Try to find the element again
                const element = findDateElement(targetDateStr);

                if (element) {
                    console.log(`Element found on retry attempt ${attempt}, performing scroll`);
                    performScroll(element, targetDate);
                } else {
                    console.log(`Element not found on retry attempt ${attempt}, will retry again`);
                    setTimeout(() => {
                        retryWithDelay(attempt + 1, maxAttempts, delay * 1.5);
                    }, delay);
                }
            };

            // Start retry process with initial delay of 100ms (increased from 50ms), up to 4 attempts (increased from 3)
            setTimeout(() => {
                retryWithDelay(1, 4, 100);
            }, 100);
        }
    }, [containerRef, groupedEvents, hasEventsOnDate, onVisibleDateChange, performScroll, findDateElement]);

    // Add scroll event listener with improved cleanup
    useEffect(() => {
        const currentRef = containerRef.current;
        if (currentRef) {
            console.log(`Adding scroll event listener to container`);
            currentRef.addEventListener('scroll', throttledScrollHandler);

            // Log initial container dimensions for debugging
            const rect = currentRef.getBoundingClientRect();
            console.log(`Container dimensions: width=${rect.width}px, height=${rect.height}px, top=${rect.top}px`);

            // Log initial date elements
            const dateElements = currentRef.querySelectorAll('[data-date]');
            console.log(`Found ${dateElements.length} date elements in container`);

            return () => {
                console.log(`Removing scroll event listener from container`);
                currentRef.removeEventListener('scroll', throttledScrollHandler);
            };
        }
    }, [throttledScrollHandler, containerRef]);

    // Expose scrollToDate method via ref and ensure it's always available
    useEffect(() => {
        if (containerRef.current) {
            console.log(`Exposing scrollToDate method via ref`);
            // Store the scrollToDate function on the DOM element
            (containerRef.current as any).scrollToDate = scrollToDate;

            // Also expose it globally for debugging purposes
            if (typeof window !== 'undefined') {
                (window as any).__virtualizedEventsListScrollToDate = scrollToDate;
                console.log(`Exposed scrollToDate method globally as window.__virtualizedEventsListScrollToDate`);
            }
        }

        // Clean up function to remove the method when component unmounts
        return () => {
            if (containerRef.current) {
                console.log(`Removing scrollToDate method from ref`);
                delete (containerRef.current as any).scrollToDate;
            }

            // Also remove the global reference
            if (typeof window !== 'undefined' && (window as any).__virtualizedEventsListScrollToDate) {
                console.log(`Removing global scrollToDate method`);
                delete (window as any).__virtualizedEventsListScrollToDate;
            }
        };
    }, [scrollToDate, containerRef]);

    return {
        isScrolling,
        lastSelectedDate,
        highlightedDate,
        noEventsMessage,
        scrollToDate,
        setHighlightedDate,
        setNoEventsMessage,
        setLastSelectedDate
    };
}
