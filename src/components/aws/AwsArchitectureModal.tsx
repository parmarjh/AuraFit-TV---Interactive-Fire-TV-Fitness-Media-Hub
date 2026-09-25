import React, { useState } from 'react';
import { AWS_SERVICES, INITIAL_TELEMETRY } from '../../data/awsArchitecture';
import { AwsServiceDetail, TelemetryPacket } from '../../types';
import {
  Cloud,
  Cpu,
  Database,
  Radio,
  Lock,
  Send,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  Server,
  Sparkles,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface AwsArchitectureModalProps {
  onOpenProposal: () => void;
}

export const AwsArchitectureModal: React.FC<AwsArchitectureModalProps> = ({
  onOpenProposal,
}) => {
  const [selectedService, setSelectedService] = useState<AwsServiceDetail>(AWS_SERVICES[0]);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryPacket[]>(INITIAL_TELEMETRY);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Trigger test telemetry packet
  const handleSendTestTelemetry = () => {
    playRemoteClick();
    setSimulating(true);
    setTimeout(() => {
      const newPkt: TelemetryPacket = {
        id: `pkt-${Date.now().toString().slice(-4)}`,
        timestamp: 'Just now',
        source: 'AppSync GraphQL',
        topicOrAction: 'firetv/biometrics/mutation',
        payload: {
          bpm: Math.floor(130 + Math.random() * 35),
          caloriesBurned: Math.floor(210 + Math.random() * 40),
          tvBufferLatencyMs: Math.floor(12 + Math.random() * 8),
          fanSyncStatus: 'synced_level_2',
        },
        latencyMs: Math.floor(14 + Math.random() * 10),
      };
      setTelemetryLogs((prev) => [newPkt, ...prev.slice(0, 7)]);
      setSimulating(false);
    }, 400);
  };

  const totalMonthlyCost = AWS_SERVICES.reduce((acc, curr) => acc + curr.estimatedMonthlyCost, 0);
  const totalCreditsRequested = AWS_SERVICES.reduce((acc, curr) => acc + curr.requestedCredits, 0);

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'Compute':
        return <Cpu className="w-4 h-4 text-orange-400" />;
      case 'Database':
        return <Database className="w-4 h-4 text-blue-400" />;
      case 'IoT & Sync':
        return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'Auth':
        return <Lock className="w-4 h-4 text-rose-400" />;
      default:
        return <Server className="w-4 h-4 text-amber-400" />;
    }
  };

  const copyArchitectureSummary = () => {
    playRemoteSelect();
    const text = `AuraFit TV - AWS Cloud Infrastructure Overview\n\nTotal Monthly Estimated Cost: $${totalMonthlyCost}\nTotal 6-Month Pilot Credit Request: $${totalCreditsRequested}\n\nArchitecture Components:\n` +
      AWS_SERVICES.map(
        (s) => `- ${s.service} (${s.category}): ${s.roleInFireTv} [Protocol: ${s.protocolOrApi}]`
      ).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/40 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="text-xs uppercase tracking-wider font-mono text-amber-500 font-bold">
              Fire TV Track Cloud Infrastructure
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            AWS Cloud Architecture & Real-Time Sync Engine
          </h2>
          <p className="text-sm text-neutral-300 mt-1 max-w-2xl leading-relaxed">
            Engineered for Amazon Fire TV to deliver sub-20ms biometric viewing widgets,
            serverless workout recommendations, and living room IoT automation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyArchitectureSummary}
            className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Architecture' : 'Copy Specs'}</span>
          </button>

          <button
            onClick={onOpenProposal}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Generate Credit Proposal</span>
          </button>
        </div>
      </div>

      {/* Cloud Architecture Topology Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AWS Services Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800/80">
              <h3 className="text-sm font-bold font-display text-white">
                AWS Services Stack & Role in Fire TV Experience
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                6 Active Subsystems
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AWS_SERVICES.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    playRemoteClick();
                    setSelectedService(item);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedService.id === item.id
                      ? 'bg-neutral-800 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800">
                        {getServiceIcon(item.category)}
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-[160px]">
                        {item.service}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      ${item.estimatedMonthlyCost}/mo
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.roleInFireTv}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 font-mono">{item.protocolOrApi}</span>
                    <span className="text-amber-400 font-mono font-medium">
                      ${item.requestedCredits} credits
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Service Deep Dive Card */}
            {selectedService && (
              <div className="mt-5 p-4 rounded-xl bg-neutral-950 border border-amber-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">
                      Selected Architecture Node
                    </span>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="text-xs text-neutral-300 font-semibold">{selectedService.service}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    Target SLA: 99.99%
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {selectedService.roleInFireTv}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-800/80 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Communication Protocol</span>
                    <span className="font-mono text-white font-medium">{selectedService.protocolOrApi}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Monthly Cloud Cost</span>
                    <span className="font-mono text-white font-medium">${selectedService.estimatedMonthlyCost} USD</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">6-Mo Credit Allocation</span>
                    <span className="font-mono text-amber-400 font-medium">${selectedService.requestedCredits} USD</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Telemetry Stream & Cost Ledger */}
        <div className="space-y-4">
          {/* Credit Ledger Summary */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold font-display text-white mb-3">
              AWS Credit Grant Breakdown
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400">Estimated Monthly Compute & Storage</span>
                <span className="font-mono font-bold text-white tabular-nums">${totalMonthlyCost}/mo</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400">Total Requested Credits (6-Mo Pilot)</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">${totalCreditsRequested} USD</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <span className="font-medium">Target Device Platform</span>
                <span className="font-mono font-bold">Amazon Fire TV 4K</span>
              </div>
            </div>
          </div>

          {/* Real-time Cloud Telemetry Simulator */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Live Cloud Telemetry</h4>
                <span className="text-[11px] text-neutral-400">Sub-second AppSync & IoT stream</span>
              </div>
              <button
                onClick={handleSendTestTelemetry}
                disabled={simulating}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3 text-amber-500" />
                <span>{simulating ? 'Sending...' : 'Emit Ping'}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {telemetryLogs.map((pkt) => (
                <div
                  key={pkt.id}
                  className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 text-[11px] font-mono"
                >
                  <div className="flex items-center justify-between text-neutral-400 mb-1">
                    <span className="text-amber-400 font-medium">{pkt.source}</span>
                    <span className="tabular-nums text-emerald-400">{pkt.latencyMs}ms</span>
                  </div>
                  <div className="text-neutral-300 truncate">
                    {pkt.topicOrAction}
                  </div>
                  <div className="text-neutral-500 text-[10px] mt-1 truncate">
                    {JSON.stringify(pkt.payload)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
