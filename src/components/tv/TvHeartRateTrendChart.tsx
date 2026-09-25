import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { SmartHomeState, HeartRatePoint } from '../../types';
import { Heart, Activity, Zap, TrendingUp, ShieldCheck, Flame, Radio, ArrowUp, ArrowDown } from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';
import { generate15MinHeartRateHistory, getZoneFromBpm } from '../../data/heartRateData';

interface TvHeartRateTrendChartProps {
  smartHomeState: SmartHomeState;
  onUpdateSmartHome?: (updater: (prev: SmartHomeState) => SmartHomeState) => void;
}

export const TvHeartRateTrendChart: React.FC<TvHeartRateTrendChartProps> = ({
  smartHomeState,
  onUpdateSmartHome,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hoveredPoint, setHoveredPoint] = useState<HeartRatePoint | null>(null);

  // Derive 15-minute heart rate data from current smartHomeState
  const heartRateData: HeartRatePoint[] = useMemo(() => {
    if (smartHomeState.heartRateHistory && smartHomeState.heartRateHistory.length >= 10) {
      return smartHomeState.heartRateHistory;
    }
    // If not already in smartHomeState, generate based on current smartHomeState.currentBpm
    return generate15MinHeartRateHistory(smartHomeState.currentBpm || 128);
  }, [smartHomeState.heartRateHistory, smartHomeState.currentBpm]);

  // Measure container width for responsive SVG rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute metrics
  const bpms = heartRateData.map((d) => d.bpm);
  const currentBpm = smartHomeState.currentBpm;
  const currentZone = smartHomeState.targetZone;
  const maxBpm = Math.max(...bpms, currentBpm);
  const minBpm = Math.min(...bpms, currentBpm);
  const avgBpm = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || heartRateData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawings

    const width = containerWidth;
    const height = 260;
    const margin = { top: 24, right: 35, bottom: 35, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([-15, 0])
      .range([0, innerWidth]);

    const yMin = Math.max(50, Math.floor((minBpm - 12) / 10) * 10);
    const yMax = Math.min(200, Math.ceil((maxBpm + 15) / 10) * 10);

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([innerHeight, 0]);

    // Root Group
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradients & Defs
    const defs = svg.append('defs');

    // Area Gradient (Amber / Rose to Transparent)
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'hr-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', currentBpm >= 140 ? '#f43f5e' : '#f59e0b')
      .attr('stop-opacity', 0.45);

    areaGradient
      .append('stop')
      .attr('offset', '70%')
      .attr('stop-color', currentBpm >= 140 ? '#f43f5e' : '#f59e0b')
      .attr('stop-opacity', 0.08);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#171717')
      .attr('stop-opacity', 0.0);

    // Stroke Gradient (Warmup to Peak)
    const strokeGradient = defs
      .append('linearGradient')
      .attr('id', 'hr-line-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', innerHeight)
      .attr('x2', 0)
      .attr('y2', 0);

    strokeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981'); // Warmup
    strokeGradient.append('stop').attr('offset', '45%').attr('stop-color', '#f59e0b'); // Aerobic
    strokeGradient.append('stop').attr('offset', '75%').attr('stop-color', '#f97316'); // Threshold
    strokeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e'); // Peak

    // Background horizontal grid lines
    const yTicks = yScale.ticks(5);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#262626')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1);

    // Zone Threshold reference bands
    const zoneBands = [
      { name: 'Peak (160+)', threshold: 160, color: '#f43f5e' },
      { name: 'Threshold (140-159)', threshold: 140, color: '#f97316' },
      { name: 'Aerobic (120-139)', threshold: 120, color: '#f59e0b' },
    ];

    zoneBands.forEach((zb) => {
      if (zb.threshold >= yMin && zb.threshold <= yMax) {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', yScale(zb.threshold))
          .attr('y2', yScale(zb.threshold))
          .attr('stroke', zb.color)
          .attr('stroke-opacity', 0.25)
          .attr('stroke-dasharray', '4 4')
          .attr('stroke-width', 1.2);

        g.append('text')
          .attr('x', innerWidth - 4)
          .attr('y', yScale(zb.threshold) - 4)
          .attr('text-anchor', 'end')
          .attr('fill', zb.color)
          .attr('fill-opacity', 0.6)
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .text(zb.name);
      }
    });

    // Area Generator
    const areaGenerator = d3
      .area<HeartRatePoint>()
      .x((d) => xScale(d.minuteOffset))
      .y0(innerHeight)
      .y1((d) => yScale(d.bpm))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const lineGenerator = d3
      .line<HeartRatePoint>()
      .x((d) => xScale(d.minuteOffset))
      .y((d) => yScale(d.bpm))
      .curve(d3.curveMonotoneX);

    // Draw Area
    g.append('path')
      .datum(heartRateData)
      .attr('fill', 'url(#hr-area-gradient)')
      .attr('d', areaGenerator);

    // Draw Main Line
    g.append('path')
      .datum(heartRateData)
      .attr('fill', 'none')
      .attr('stroke', 'url(#hr-line-gradient)')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', lineGenerator);

    // X-Axis
    const xTicks = [-15, -12, -9, -6, -3, 0];
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(xTicks)
      .tickFormat((d) => (d === 0 ? 'Now' : `${d}m`));

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#404040');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#404040');
    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#a3a3a3')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Y-Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${d}`);

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('.tick line').attr('stroke', '#262626');
    yAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#737373')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Data points (Dots along the curve)
    g.selectAll('.dot')
      .data(heartRateData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => xScale(d.minuteOffset))
      .attr('cy', (d) => yScale(d.bpm))
      .attr('r', (d) => (d.minuteOffset === 0 ? 5 : 3))
      .attr('fill', (d) => {
        if (d.zone === 'Peak') return '#f43f5e';
        if (d.zone === 'Threshold') return '#f97316';
        if (d.zone === 'Aerobic') return '#f59e0b';
        return '#10b981';
      })
      .attr('stroke', '#171717')
      .attr('stroke-width', 2);

    // Pulsing Latest Point (Now / 0m)
    const latestPoint = heartRateData[heartRateData.length - 1];
    if (latestPoint) {
      const pulseGroup = g
        .append('g')
        .attr('transform', `translate(${xScale(0)},${yScale(latestPoint.bpm)})`);

      // Outer pulse ring
      pulseGroup
        .append('circle')
        .attr('r', 9)
        .attr('fill', 'none')
        .attr('stroke', currentBpm >= 140 ? '#f43f5e' : '#f59e0b')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '6;15;6')
        .attr('dur', '1.6s')
        .attr('repeatCount', 'indefinite');

      pulseGroup
        .append('circle')
        .attr('r', 5)
        .attr('fill', currentBpm >= 140 ? '#f43f5e' : '#f59e0b')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);
    }

    // Hover Interaction Overlay
    const bisect = d3.bisector<HeartRatePoint, number>((d) => d.minuteOffset).left;
    const focusLine = g
      .append('line')
      .attr('stroke', '#e5e5e5')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    const focusCircle = g
      .append('circle')
      .attr('r', 6)
      .attr('fill', '#ffffff')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2.5)
      .style('opacity', 0);

    svg
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', (event) => {
        const [xPos] = d3.pointer(event);
        const xVal = xScale.invert(xPos);
        const idx = bisect(heartRateData, xVal, 1);
        const d0 = heartRateData[idx - 1];
        const d1 = heartRateData[idx];
        let d = d0;
        if (d1 && Math.abs(xVal - d0.minuteOffset) > Math.abs(d1.minuteOffset - xVal)) {
          d = d1;
        }
        if (d) {
          setHoveredPoint(d);
          focusLine
            .attr('x1', xScale(d.minuteOffset))
            .attr('x2', xScale(d.minuteOffset))
            .style('opacity', 0.8);

          focusCircle
            .attr('cx', xScale(d.minuteOffset))
            .attr('cy', yScale(d.bpm))
            .attr('stroke', d.zone === 'Peak' ? '#f43f5e' : '#f59e0b')
            .style('opacity', 1);
        }
      })
      .on('mouseleave', () => {
        setHoveredPoint(null);
        focusLine.style('opacity', 0);
        focusCircle.style('opacity', 0);
      });
  }, [containerWidth, heartRateData, currentBpm, minBpm, maxBpm]);

  // Handler to adjust BPM and sync into smartHomeState
  const handleSimulateBpmChange = (delta: number) => {
    if (!onUpdateSmartHome) return;
    playRemoteClick();
    onUpdateSmartHome((prev) => {
      const nextBpm = Math.max(70, Math.min(195, prev.currentBpm + delta));
      const nextZone = getZoneFromBpm(nextBpm);
      const newHistory = generate15MinHeartRateHistory(nextBpm);
      return {
        ...prev,
        currentBpm: nextBpm,
        targetZone: nextZone,
        heartRateHistory: newHistory,
      };
    });
  };

  const handleSetTargetZoneBpm = (targetBpm: number) => {
    if (!onUpdateSmartHome) return;
    playRemoteSelect();
    onUpdateSmartHome((prev) => {
      const nextZone = getZoneFromBpm(targetBpm);
      const newHistory = generate15MinHeartRateHistory(targetBpm);
      return {
        ...prev,
        currentBpm: targetBpm,
        targetZone: nextZone,
        heartRateHistory: newHistory,
      };
    });
  };

  const getZoneColorClass = (zone: string) => {
    switch (zone) {
      case 'Peak':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      case 'Threshold':
        return 'text-orange-400 bg-orange-950/80 border-orange-800';
      case 'Aerobic':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      default:
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl relative overflow-hidden"
    >
      {/* Ambient background glow matching heart rate intensity */}
      <div
        className={`absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-700 ${
          currentBpm >= 160
            ? 'bg-rose-600'
            : currentBpm >= 140
            ? 'bg-orange-600'
            : currentBpm >= 120
            ? 'bg-amber-600'
            : 'bg-emerald-600'
        }`}
      />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
            <Heart className="w-5 h-5 fill-rose-500/30 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold font-display text-white">
                Biometric Telemetry: 15-Minute Heart Rate Trend
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                d3.js Engine
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getZoneColorClass(currentZone)}`}>
                {currentZone} Zone
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
              <span>Streaming BLE sensor telemetry from {smartHomeState.pairedHeartRateDevice || 'Wearable BLE'}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                <Radio className="w-3 h-3 animate-ping" />
                Live 1Hz Feed
              </span>
            </p>
          </div>
        </div>

        {/* Current BPM Stat Badge */}
        <div className="flex items-center gap-4 shrink-0 bg-neutral-950/80 border border-neutral-800/80 rounded-xl px-4 py-2.5">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Current Rate</div>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-2xl font-black font-display text-white tracking-tight tabular-nums">
                {currentBpm}
              </span>
              <span className="text-xs font-semibold text-rose-400">BPM</span>
            </div>
          </div>

          <div className="h-8 w-px bg-neutral-800" />

          {/* Calorie burn rate */}
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Session Burn</div>
            <div className="flex items-baseline gap-1.5 justify-end text-orange-400">
              <span className="text-xl font-bold font-display tabular-nums">
                {smartHomeState.caloriesBurned}
              </span>
              <span className="text-xs font-semibold">kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main D3 Chart Canvas */}
      <div className="mt-4 relative">
        <svg
          ref={svgRef}
          className="w-full overflow-visible"
          style={{ maxHeight: '260px' }}
        />

        {/* Interactive Hover Point HUD Box */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-neutral-950/90 border border-neutral-700/80 rounded-lg px-3 py-1.5 shadow-xl text-xs backdrop-blur-md flex items-center gap-3 pointer-events-none animate-in fade-in duration-150">
            <div>
              <span className="text-neutral-400 font-mono text-[10px]">Time: </span>
              <span className="text-white font-mono font-bold">{hoveredPoint.label}</span>
              <span className="text-neutral-500 text-[10px] ml-1">({hoveredPoint.timestamp})</span>
            </div>
            <div className="h-3 w-px bg-neutral-800" />
            <div>
              <span className="text-neutral-400 font-mono text-[10px]">Heart Rate: </span>
              <span className="text-rose-400 font-mono font-bold">{hoveredPoint.bpm} BPM</span>
            </div>
            <div className="h-3 w-px bg-neutral-800" />
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${getZoneColorClass(hoveredPoint.zone)}`}>
              {hoveredPoint.zone}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Bar: Stats & Simulator Controls */}
      <div className="mt-4 pt-3.5 border-t border-neutral-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        {/* Metric pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl px-3 py-2">
            <div className="text-[10px] font-mono text-neutral-500 uppercase">Avg 15m BPM</div>
            <div className="text-sm font-bold font-mono text-neutral-200 mt-0.5">{avgBpm} BPM</div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl px-3 py-2">
            <div className="text-[10px] font-mono text-neutral-500 uppercase">Peak Pulse</div>
            <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">{maxBpm} BPM</div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl px-3 py-2">
            <div className="text-[10px] font-mono text-neutral-500 uppercase">Minimum</div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{minBpm} BPM</div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl px-3 py-2">
            <div className="text-[10px] font-mono text-neutral-500 uppercase">BLE Latency</div>
            <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">14ms</div>
          </div>
        </div>

        {/* Live Simulator quick buttons for interactive testing */}
        {onUpdateSmartHome && (
          <div className="flex items-center gap-2 flex-wrap lg:justify-end">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mr-1">
              Simulate:
            </span>

            <button
              onClick={() => handleSimulateBpmChange(-5)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Lower BPM by 5"
            >
              <ArrowDown className="w-3 h-3 text-cyan-400" />
              <span>-5 BPM</span>
            </button>

            <button
              onClick={() => handleSimulateBpmChange(+5)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Increase BPM by 5"
            >
              <ArrowUp className="w-3 h-3 text-rose-400" />
              <span>+5 BPM</span>
            </button>

            <button
              onClick={() => handleSetTargetZoneBpm(168)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Set to Peak Zone (168 BPM)"
            >
              Peak (168)
            </button>

            <button
              onClick={() => handleSetTargetZoneBpm(132)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Set to Aerobic Zone (132 BPM)"
            >
              Aerobic (132)
            </button>

            <button
              onClick={() => handleSetTargetZoneBpm(98)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Set to Warmup Zone (98 BPM)"
            >
              Warmup (98)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
