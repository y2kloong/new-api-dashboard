import { useEffect, useRef } from 'react'
import { echarts, type EChartsCoreOption } from '../lib/echarts'

interface ChartProps {
  option: EChartsCoreOption
  height: number
}

export function Chart({ option, height }: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const instance = echarts.init(element)
    chartRef.current = instance
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(element)
    return () => {
      observer.disconnect()
      instance.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  return <div className='chart-host' ref={containerRef} style={{ height }} />
}
