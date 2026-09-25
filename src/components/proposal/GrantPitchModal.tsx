import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface GrantPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrantPitchModal: React.FC<GrantPitchModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'summary' | 'architecture' | 'budget' | 'roadmap'>('summary');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullPitchText = `# Fire TV Track Application: AuraFit TV (Interactive Media & Fitness Platform)

## 1. Executive Summary & Value Proposition
AuraFit TV is an interactive media and fitness platform custom-architected for the Amazon Fire TV 10-foot living room experience. It transforms the television into an intelligent workout studio and smart living room control center, offering personalized workout recommendations and real-time viewing widgets (biometric Heart Rate HUD, continuous active calorie burn telemetry, and interval rep cadence). Furthermore, the application provides an integrated living room smart dashboard allowing users to review their daily fitness schedules and control connected smart devices (high-velocity workout fans, ambient TV backlights, and thermostats) directly from their television screen using the Fire TV remote and Alexa voice commands.

## 2. AWS Cloud Infrastructure Architecture
The platform relies on AWS services to guarantee sub-20ms latency and high reliability:
- **User Authentication**: Amazon Cognito with RFC 8628 Device Authorization Grant, enabling instantaneous QR code/6-digit TV activation.
- **Biometric Real-Time Sync**: AWS AppSync (GraphQL Subscriptions over WebSockets) for continuous sub-second telemetry sync between wearables, mobile, and Fire TV HUD.
- **High-Throughput Database**: Amazon DynamoDB single-table design with Global Secondary Indexes for user profiles, workout catalog, and time-series biometric logs.
- **Serverless Compute**: AWS Lambda (ARM Graviton3) for recommendation inference, interval pacing, and automated notification triggers.
- **Living Room Device Control**: AWS IoT Core (MQTT over TLS 1.3) bridging Fire TV with smart home workout fans and ambient lights.
- **Adaptive Video Delivery**: AWS Elemental MediaLive, Amazon S3, and Amazon CloudFront for ultra-low latency HLS (LL-HLS) video streaming to Fire TV Stick 4K.

## 3. Requested AWS Credit Grant Justification
Total Requested Grant: $5,000 USD (Covering 6 Months of Development, Rigorous Testing, and User Pilot Phase)
- Amazon CloudFront & S3 Video Storage/Streaming: $1,450 (High-bitrate HLS streams, asset distribution)
- AWS AppSync (GraphQL & WebSockets): $1,200 (Continuous live telemetry connections during workouts)
- Amazon DynamoDB: $850 (On-demand read/write capacity and biometric time-series)
- AWS Lambda Compute: $700 (Recommendation algorithms and background sync)
- AWS IoT Core: $550 (MQTT broker for living room fan and backlight automation)
- Amazon Cognito: $250 (TV device authentication and user pool management)

## 4. Development & Pilot Milestones
- Milestone 1 (Months 1-2): Core Fire TV 10-foot client prototype, AWS Cognito device authorization flow, and AppSync GraphQL schema deployment.
- Milestone 2 (Months 3-4): Real-time biometric HUD integration with Bluetooth Low Energy (BLE) wearables and AWS IoT Core smart fan trigger testing.
- Milestone 3 (Months 5-6): Pilot deployment on Amazon Appstore for Fire TV Stick 4K & Fire TV Cube, cloud scale load testing, and telemetry latency optimization.`;

  const handleCopy = () => {
    playRemoteSelect();
    navigator.clipboard.writeText(fullPitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    playRemoteClick();
    const blob = new Blob([fullPitchText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AuraFit_TV_Fire_TV_Track_AWS_Proposal.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Fire TV Track & AWS Credit Grant Proposal
              </h3>
              <p className="text-xs text-neutral-400">
                Ready-to-submit proposal for AWS Activate, Hackathon, and Fire TV Grant Reviewers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .md</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Application'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-6 py-2 bg-neutral-950/50 border-b border-neutral-800 flex items-center gap-6 text-xs font-medium text-neutral-400">
          <button
            onClick={() => setActiveSection('summary')}
            className={`py-2 relative ${
              activeSection === 'summary'
                ? 'text-white font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
                : 'hover:text-neutral-200'
            }`}
          >
            1. Executive Summary
          </button>
          <button
            onClick={() => setActiveSection('architecture')}
            className={`py-2 relative ${
              activeSection === 'architecture'
                ? 'text-white font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
                : 'hover:text-neutral-200'
            }`}
          >
            2. AWS Cloud Architecture
          </button>
          <button
            onClick={() => setActiveSection('budget')}
            className={`py-2 relative ${
              activeSection === 'budget'
                ? 'text-white font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
                : 'hover:text-neutral-200'
            }`}
          >
            3. $5,000 Credit Justification
          </button>
          <button
            onClick={() => setActiveSection('roadmap')}
            className={`py-2 relative ${
              activeSection === 'roadmap'
                ? 'text-white font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
                : 'hover:text-neutral-200'
            }`}
          >
            4. Roadmap & Milestones
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm text-neutral-300 leading-relaxed">
          {activeSection === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-neutral-200">
                <span className="font-bold text-amber-400 text-sm block mb-1">
                  Project Title: AuraFit TV - Interactive Living Room Media & Fitness Platform
                </span>
                <p>
                  Target Category: <strong>Amazon Fire TV Track (Smart Living Room & Media Experiences)</strong>
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-1">Problem & Opportunity</h4>
                <p>
                  Traditional television fitness apps are passive one-way video players. Users stare at a pre-recorded workout without feedback, leaving them unaware of their heart rate zones, cadence, or calories burned. Furthermore, modern living rooms are filled with connected smart devices (fans, smart lights, smart thermostats) that remain completely siloed from the television viewing experience.
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-1">Solution on Fire TV</h4>
                <p>
                  AuraFit TV bridges this gap by turning Fire TV into an interactive bio-feedback hub. It combines adaptive video streaming with real-time biometric HUD widgets (heart rate, active calories, effort zones) and gives users direct control over connected living room devices (automated fan cooling when heart rate exceeds 140 BPM, ambient backlight syncing, and daily schedule management) without leaving their couch or interrupting their workout.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'architecture' && (
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm">How AWS Powers Low-Latency TV Experiences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="font-bold text-amber-400 block mb-1">Amazon Cognito (RFC 8628)</span>
                  <p className="text-xs text-neutral-400">
                    Provides zero-friction TV activation via 6-digit code or QR code device authorization grant, avoiding frustrating on-screen keyboard password typing on TV.
                  </p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="font-bold text-blue-400 block mb-1">AWS AppSync (GraphQL & WSS)</span>
                  <p className="text-xs text-neutral-400">
                    Maintains persistent WebSocket connections between wearable sensors, mobile devices, and the Fire TV HUD with &lt;20ms latency.
                  </p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="font-bold text-emerald-400 block mb-1">AWS IoT Core</span>
                  <p className="text-xs text-neutral-400">
                    MQTT broker managing bidirectional living room automation: smart fans speed up automatically when cardio intensity climbs, and lighting tints to match workout energy.
                  </p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="font-bold text-orange-400 block mb-1">Amazon DynamoDB & AWS Lambda</span>
                  <p className="text-xs text-neutral-400">
                    Serverless recommendations engine computing energy-level matches, user recovery states, and logging telemetry data with single-digit millisecond latency.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'budget' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <div>
                  <span className="text-white font-bold text-sm block">Total Requested AWS Credits</span>
                  <span className="text-xs text-neutral-400">6-Month Prototype, Testing, & Pilot Phase</span>
                </div>
                <span className="text-xl font-bold font-mono text-amber-400">$5,000 USD</span>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                  Line-Item Breakdown & Resource Sizing
                </h5>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                    <span>CloudFront Edge CDN & S3 Video Storage (LL-HLS)</span>
                    <span className="font-mono text-white font-semibold">$1,450</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                    <span>AWS AppSync (Sub-second Real-time WebSockets & Subscriptions)</span>
                    <span className="font-mono text-white font-semibold">$1,200</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                    <span>Amazon DynamoDB (On-Demand Capacity & Biometric GSI Logs)</span>
                    <span className="font-mono text-white font-semibold">$850</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                    <span>AWS Lambda (Serverless Compute, Graviton3 Recommendation Functions)</span>
                    <span className="font-mono text-white font-semibold">$700</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                    <span>AWS IoT Core (MQTT Broker for Connected Living Room Equipment)</span>
                    <span className="font-mono text-white font-semibold">$550</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                    <span>Amazon Cognito (User Authentication & Device Authorization Flow)</span>
                    <span className="font-mono text-white font-semibold">$250</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'roadmap' && (
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm">6-Month Implementation Milestones</h4>
              <div className="space-y-3">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Milestone 1: TV Client & Cloud Foundation (Months 1-2)</h5>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      Deploy AWS Cognito device authentication, AppSync GraphQL schema, and initial 10-foot Fire TV UI with remote navigation support.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Milestone 2: Biometric HUD & IoT Bridge (Months 3-4)</h5>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      Connect Bluetooth smartwatches with AWS AppSync live subscriptions. Implement AWS IoT Core MQTT rules for living room fan and light automation.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Milestone 3: Amazon Fire TV Pilot Release (Months 5-6)</h5>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      Deploy pilot on Amazon Appstore for Fire TV Stick 4K and Fire TV Cube. Run stress tests for concurrent HLS video streams and low-latency cloud buffers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Structured for Amazon Fire TV Track Review Guidelines</span>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer"
          >
            {copied ? 'Copied Full Proposal!' : 'Copy Full Proposal Text'}
          </button>
        </div>
      </div>
    </div>
  );
};
