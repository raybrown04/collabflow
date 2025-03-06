"use client"

import { useState, useEffect, useRef } from 'react'

export function useTaskDropdowns() {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Toggle dropdown visibility
    const toggleDropdown = (name: string) => {
        setOpenDropdown(prev => prev === name ? null : name)
    }

    // Check if a dropdown is open
    const isDropdownOpen = (name: string) => openDropdown === name

    return { toggleDropdown, isDropdownOpen, dropdownRef, openDropdown }
}

export default useTaskDropdowns
