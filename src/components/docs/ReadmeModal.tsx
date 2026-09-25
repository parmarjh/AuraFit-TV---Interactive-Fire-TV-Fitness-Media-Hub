import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Tv,
  Heart,
  Cpu,
  Zap,
  Mic,
  Cloud,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Play,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWorkout?: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({
  isOpen,
  onClose,
  onLaunchWorkout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'remote' | 'architecture' | 'setup'>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    playRemoteSelect();
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  AuraFit TV — Interactive Documentation & README
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                  Fire TV Hub
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                10-Foot Living Room Fitness, Biometric HUD, Smart Home IoT & AWS Cloud Architecture
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playRemoteClick();
              onClose();
            }}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close README Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-neutral-900/40 border-b border-neutral-800/80 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Overview & Mission', icon: Tv },
            { id: 'features', label: 'Key Features & HUD', icon: Heart },
            { id: 'remote', label: 'Remote & Hotkeys', icon: Sliders },
            { id: 'architecture', label: 'AWS & Gemini AI', icon: Cloud },
            { id: 'setup', label: 'Setup & API Guide', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playRemoteClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm shadow-amber-500/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/20">
                <h3 className="text-base font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Vision & Executive Summary
                </h3>
                <p className="text-neutral-300 leading-relaxed text-xs md:text-sm">
                  <strong>AuraFit TV</strong> transforms standard living room television screens into an intelligent,
                  fully synchronized workout studio and connected smart home hub for <strong>Amazon Fire TV</strong>.
                  While following video workouts, real-time biometrics stream from personal wearables directly onto a
                  non-intrusive Heads-Up Display (HUD), dynamically triggering environmental adjustments (high-velocity workout fans,
                  thermostat cooling, and ambient RGB mood backlighting) to keep athletes in their target aerobic zone.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                    <Tv className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">10-Foot Lean-Back UI</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    High contrast, oversized typography, and directional focus indicators designed to be effortlessly navigated from a couch with the Fire TV Remote.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                    <Heart className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">Real-Time Biometric HUD</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Sub-second continuous Heart Rate (BPM), calorie burn metrics, and 15-minute trendlines rendered via dynamic D3 SVG curves.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">Living Room Automation</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Autonomous IoT rules engine that ramps up fan cooling when heart rate spikes and switches lighting modes between HIIT and Yoga recovery.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3 text-neutral-400">
                  Quick Navigation Guide
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
                    <span className="font-semibold text-amber-400 block mb-0.5">TV Dashboard</span>
                    <span className="text-neutral-400">Recommended workouts, quick stats, and smart widget glance</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
                    <span className="font-semibold text-amber-400 block mb-0.5">Workouts Catalog</span>
                    <span className="text-neutral-400">Cardio, HIIT, Yoga, and Strength sessions with video streaming</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
                    <span className="font-semibold text-amber-400 block mb-0.5">Smart Automate</span>
                    <span className="text-neutral-400">Configurable biometric rules and live IoT execution audit logs</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
                    <span className="font-semibold text-amber-400 block mb-0.5">Living Room</span>
                    <span className="text-neutral-400">Manual sliders for fans, thermostat, and ambient scenes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/60">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  Interactive Workout Player & Live Biometric HUD
                </h3>
                <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
                  When starting any workout, the video player initiates an active workout session. The screen features a non-intrusive floating biometric HUD:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-neutral-300">
                  <li className="flex items-start gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/60">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Live BPM & Zone Tracker:</strong> Automatically identifies Warm Up (90-114), Fat Burn (115-134), Aerobic (135-154), Anaerobic (155-174), and Peak (175+ BPM).</span>
                  </li>
                  <li className="flex items-start gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/60">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Calorie Telemetry:</strong> Continuously computes cumulative kilocalories burned based on heart rate exertion coefficients.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/60">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>15-Minute D3 Sparkline:</strong> Live-updating SVG curve showing exertion spikes and stabilization periods.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/60">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Interval Rep Cadence:</strong> Integrated timers for high-intensity work sets and rest intervals.</span>
                  </li>
                </ul>
              </div>

              <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/60">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Smart Home Living Room Scenes
                </h3>
                <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
                  Pre-configured environmental presets allow one-click changes across all room devices:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-blue-400 block mb-1">Cardio Flow</span>
                    <span className="text-neutral-400">Airflow Level 2, Ambient Amber backlight, Target 68°F.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-emerald-400 block mb-1">Zen Recovery & Yoga</span>
                    <span className="text-neutral-400">Airflow Level 1, Gentle Emerald backlight, Target 72°F.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-red-400 block mb-1">HIIT Inferno</span>
                    <span className="text-neutral-400">Airflow Level 3 (Max), High-intensity Crimson glow, Target 66°F.</span>
                  </div>
                </div>
              </div>

              <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/60">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  Alexa Voice Command Support
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  AuraFit TV supports standard Alexa voice queries such as:
                  <code className="text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 mx-1">
                    "Alexa, turn workout fan to high"
                  </code>,
                  <code className="text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 mx-1">
                    "Alexa, start 20-minute HIIT"
                  </code>, and
                  <code className="text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 mx-1">
                    "Alexa, set lights to Zen mode"
                  </code>.
                  Access the <strong>Voice History</strong> modal from the top menu to view real-time transcribed command payloads.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'remote' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-amber-400" />
                  Physical Keyboard Shortcuts & Remote Mapping
                </h3>
                <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                  You can control AuraFit TV using either the on-screen simulated Fire TV Remote or your computer keyboard:
                </p>

                <div className="overflow-hidden rounded-lg border border-neutral-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-800/80 text-neutral-300 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Keyboard Key</th>
                        <th className="py-2.5 px-3">Fire TV Action</th>
                        <th className="py-2.5 px-3">Function</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-300">
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">Arrow Keys (↑ ↓ ← →)</td>
                        <td className="py-2.5 px-3 font-medium">D-Pad Navigation</td>
                        <td className="py-2.5 px-3">Move focus between workout cards, sliders, and navigation options</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">Enter</td>
                        <td className="py-2.5 px-3 font-medium">Select / OK Button</td>
                        <td className="py-2.5 px-3">Open focused workout, trigger selected setting, or toggle automation</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">Escape / Backspace</td>
                        <td className="py-2.5 px-3 font-medium">Back Button</td>
                        <td className="py-2.5 px-3">Close video player, dismiss open modals, return to previous view</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">Spacebar</td>
                        <td className="py-2.5 px-3 font-medium">Play / Pause</td>
                        <td className="py-2.5 px-3">Pause or resume active workout stream and cadence timer</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">H</td>
                        <td className="py-2.5 px-3 font-medium">Home Button</td>
                        <td className="py-2.5 px-3">Return immediately to the TV Home Dashboard tab</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">M</td>
                        <td className="py-2.5 px-3 font-medium">Remote Toggle</td>
                        <td className="py-2.5 px-3">Dock or undock the floating Amazon Fire TV Remote controller</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">S</td>
                        <td className="py-2.5 px-3 font-medium">Sound FX Toggle</td>
                        <td className="py-2.5 px-3">Turn TV UI tactile audio navigation clicks on or off</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-orange-400" />
                  AWS Cloud Architecture Blueprint
                </h3>
                <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
                  AuraFit TV is architected for enterprise Amazon Fire TV deployment utilizing serverless, sub-second AWS infrastructure:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-amber-400 block mb-1">Amazon Cognito (RFC 8628)</span>
                    <span className="text-neutral-400">Device Authorization Grant enables fast 6-digit TV activation or mobile QR code sign-in without a keyboard.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-amber-400 block mb-1">AWS AppSync (GraphQL Subscriptions)</span>
                    <span className="text-neutral-400">Maintains persistent WebSockets for live biometric telemetry streams from wearable to Fire TV HUD with &lt;20ms latency.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-amber-400 block mb-1">Amazon DynamoDB</span>
                    <span className="text-neutral-400">Single-table design storing user workout history, weekly itineraries, and high-frequency biometric logs with auto-partitioning.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-amber-400 block mb-1">AWS IoT Core</span>
                    <span className="text-neutral-400">Lightweight MQTT broker managing bidirectional state sync with local smart gym hardware (fans, backlights, thermostats).</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-amber-400 block mb-1">AWS Elemental MediaLive & CloudFront</span>
                    <span className="text-neutral-400">Delivers low-latency HLS (LL-HLS) workout video streams optimized for Fire TV Stick 4K hardware decoders.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-bold text-amber-400 block mb-1">AWS Lambda (Graviton3)</span>
                    <span className="text-neutral-400">Executes event-driven biometric recommendation inference, workout progression checks, and push notification triggers.</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Google Gemini 3.5 Flash Search Grounding Integration
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  The backend server (<code className="text-amber-400 font-mono">server.ts</code>) incorporates Google's latest
                  <strong>Gemini 3.5 Flash</strong> model with Google Search Grounding to generate verified sports medicine advice and
                  compute scientific room climate formulas tailored to live heart rate exertion.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  Local Development & Execution
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                      <span>1. Install dependencies:</span>
                      <button
                        onClick={() => handleCopy('npm install --legacy-peer-deps', 'install')}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode === 'install' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === 'install' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto">
                      npm install --legacy-peer-deps
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                      <span>2. Configure .env file:</span>
                      <button
                        onClick={() => handleCopy('GEMINI_API_KEY=""\nAPP_URL="http://localhost:3000"', 'env')}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode === 'env' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === 'env' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto">
                      GEMINI_API_KEY=""&#10;APP_URL="http://localhost:3000"
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                      <span>3. Start the full-stack dev server:</span>
                      <button
                        onClick={() => handleCopy('npm run dev', 'run')}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode === 'run' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === 'run' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto">
                      npm run dev
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 text-neutral-300">
                  Backend API Endpoints
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 font-bold mr-2">POST</span>
                      <span className="text-neutral-200">/api/gemini/search-grounding</span>
                    </div>
                    <span className="text-neutral-500 font-sans text-[11px]">Sports science search</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 font-bold mr-2">POST</span>
                      <span className="text-neutral-200">/api/gemini/optimize-automation</span>
                    </div>
                    <span className="text-neutral-500 font-sans text-[11px]">Climate optimization formula</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/70">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>AuraFit TV</span>
            <span>•</span>
            <span className="text-neutral-500">Amazon Fire TV 10-Foot Experience</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playRemoteClick();
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            {onLaunchWorkout && (
              <button
                onClick={() => {
                  playRemoteClick();
                  onClose();
                  onLaunchWorkout();
                }}
                className="px-4 py-1.5 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Try Workout Demo</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
