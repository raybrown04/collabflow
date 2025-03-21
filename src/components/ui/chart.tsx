"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: number[]
  smooth?: boolean
  animated?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showGrid?: boolean
  height?: number
  className?: string
}

export function Chart({
  data = [10, 20, 30, 22, 40, 35, 60, 45, 55, 48, 70, 75],
  smooth = true,
  animated = true,
  showXAxis = true,
  showYAxis = true,
  showGrid = false,
  height = 200,
  className,
  ...props
}: ChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = React.useState(0)
  
  React.useEffect(() => {
    if (chartRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setChartWidth(entry.contentRect.width)
        }
      })
      
      resizeObserver.observe(chartRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [])

  // Calculate chart dimensions
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)
  const range = maxValue - minValue
  const padding = 20
  const chartHeight = height - padding * 2
  
  // Generate SVG path for the line
  const generatePath = () => {
    if (chartWidth === 0) return ""
    
    const segmentWidth = chartWidth / (data.length - 1)
    
    return data.map((value, index) => {
      const x = index * segmentWidth
      const y = chartHeight - ((value - minValue) / range) * chartHeight + padding
      
      return `${index === 0 ? "M" : "L"} ${x} ${y}`
    }).join(" ")
  }
  
  // Generate SVG path for the area under the line
  const generateAreaPath = () => {
    if (chartWidth === 0) return ""
    
    const segmentWidth = chartWidth / (data.length - 1)
    const linePath = data.map((value, index) => {
      const x = index * segmentWidth
      const y = chartHeight - ((value - minValue) / range) * chartHeight + padding
      
      return `${index === 0 ? "M" : "L"} ${x} ${y}`
    }).join(" ")
    
    // Close the path to the bottom
    return `${linePath} L ${(data.length - 1) * segmentWidth} ${height} L 0 ${height} Z`
  }

  return (
    <div 
      ref={chartRef}
      className={cn("w-full relative", className)} 
      style={{ height: `${height}px` }}
      {...props}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
        {/* Gradient definition */}
        <defs>
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines if enabled */}
        {showGrid && (
          <g className="chart-grid">
            {/* Horizontal grid lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line 
                key={`h-grid-${i}`}
                x1="0" 
                y1={padding + (chartHeight / 4) * i} 
                x2={chartWidth} 
                y2={padding + (chartHeight / 4) * i}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}
            
            {/* Vertical grid lines */}
            {Array.from({ length: data.length }).map((_, i) => (
              <line 
                key={`v-grid-${i}`}
                x1={(chartWidth / (data.length - 1)) * i} 
                y1={padding} 
                x2={(chartWidth / (data.length - 1)) * i} 
                y2={height - padding}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}
          </g>
        )}
        
        {/* X-axis */}
        {showXAxis && (
          <line 
            x1="0" 
            y1={height - padding} 
            x2={chartWidth} 
            y2={height - padding}
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
        )}
        
        {/* Y-axis */}
        {showYAxis && (
          <line 
            x1="0" 
            y1={padding} 
            x2="0" 
            y2={height - padding}
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
        )}
        
        {/* Area under the line */}
        <path
          d={generateAreaPath()}
          fill="url(#chart-gradient)"
          className="chart-area"
        />
        
        {/* Line */}
        <path
          d={generatePath()}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "chart-line",
            animated && "animate-draw-line"
          )}
          style={{
            strokeDasharray: animated ? "1000 1000" : "none",
            strokeDashoffset: animated ? "1000" : "0",
            animation: animated ? "draw-line 1.5s ease-in-out forwards" : "none"
          }}
        />
        
        {/* Data points */}
        {data.map((value, index) => {
          const x = (chartWidth / (data.length - 1)) * index
          const y = chartHeight - ((value - minValue) / range) * chartHeight + padding
          
          return (
            <circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r="3"
              fill="hsl(var(--background))"
              stroke="hsl(var(--accent))"
              strokeWidth="2"
              className={cn(
                "chart-point",
                animated && "animate-fade-in"
              )}
              style={{
                opacity: animated ? 0 : 1,
                animation: animated ? "fade-in 0.3s ease-in-out forwards 1.5s" : "none"
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
