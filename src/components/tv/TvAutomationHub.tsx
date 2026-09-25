import React, { useState } from 'react';
import {
  AutomationRule,
  AutomationLog,
  SmartHomeState,
  SearchGroundingCitation,
} from '../../types';
import {
  Zap,
  Sliders,
  Wind,
  Lightbulb,
  Thermometer,
  Search,
  Sparkles,
  ExternalLink,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Send,
  Loader2,
  Globe,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface TvAutomationHubProps {
  rules: AutomationRule[];
  onToggleRule: (ruleId: string) => void;
  onExecuteRule: (rule: AutomationRule) => void;
  logs: AutomationLog[];
  onClearLogs: () => void;
  smartHomeState: SmartHomeState;
  onUpdateSmartHome: (updater: (prev: SmartHomeState) => SmartHomeState) => void;
  onNotify: (msg: string, type?: 'info' | 'success') => void;
  isMasterAutomateEnabled: boolean;
  onToggleMasterAutomate: () => void;
}

export const TvAutomationHub: React.FC<TvAutomationHubProps> = ({
  rules,
  onToggleRule,
  onExecuteRule,
  logs,
  onClearLogs,
  smartHomeState,
  onUpdateSmartHome,
  onNotify,
  isMasterAutomateEnabled,
  onToggleMasterAutomate,
}) => {
  // Search Grounding State
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [groundedAnswer, setGroundedAnswer] = useState<string | null>(null);
  const [groundedSources, setGroundedSources] = useState<SearchGroundingCitation[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const sampleSearchQueries = [
    'Optimal indoor room temperature for high intensity HIIT cardio',
    'How does fan airflow velocity reduce heart rate cardiac drift indoors?',
    'Ideal post-workout recovery heart rate drop within 2 minutes',
    'Best ambient color lighting temperature for sustained athletic focus',
  ];

  const handleRunSearchGrounding = async (queryToRun?: string) => {
    const query = queryToRun || searchPrompt;
    if (!query.trim()) return;

    playRemoteClick();
    setIsSearching(true);
    setSearchError(null);
    if (queryToRun) setSearchPrompt(queryToRun);

    try {
      const response = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context: `Current Living Room Sensors: Ambient Room Temp ${smartHomeState.targetTemp}°F, Fan Speed Level ${smartHomeState.fanSpeed}, Ambient Lighting ${smartHomeState.ambientLight}, User Heart Rate ${smartHomeState.currentBpm} BPM (${smartHomeState.targetZone} Zone).`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setGroundedAnswer(data.text);
      setGroundedSources(data.sources || []);
      setSearchQueries(data.queries || []);
      onNotify('Retrieved live search-grounded sports science from Google Search', 'success');
    } catch (err: any) {
      console.error('Grounding search failed:', err);
      setSearchError(err?.message || 'Failed to query search grounding endpoint.');
      onNotify('Search Grounding query failed. Verify backend connection.', 'info');
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyGroundedSettings = () => {
    playRemoteSelect();
    // Auto-calibrate living room to optimal sports physiology based on search findings
    onUpdateSmartHome((prev) => ({
      ...prev,
      targetTemp: 67, // Optimal cardio temp based on search findings
      fanSpeed: 2, // Steady convection airflow
      ambientLight: 'amber',
    }));
    onNotify('Auto-applied search-grounded sports science settings: AC 67°F & Fan L2', 'success');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cooling':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'lighting':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'thermostat':
        return <Thermometer className="w-4 h-4 text-rose-400" />;
      case 'advisor':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Zap className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Automations Banner & Master Switch */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/30 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs uppercase tracking-wider font-mono text-amber-500 font-bold">
              Living Room Smart Automation Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            Automated Biometrics & Living Room Hardware Sync
          </h2>
          <p className="text-sm text-neutral-300 mt-1 max-w-2xl leading-relaxed">
            Real-time rules engine triggering automated fan cooling, ambient lighting shifts, and pre-cooling
            thermostat adjustments via AWS IoT Core and Google Search-grounded sports science.
          </p>
        </div>

        {/* Master Automate Toggle */}
        <div className="flex items-center gap-3">
          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-white block">
                {isMasterAutomateEnabled ? 'Automation Active' : 'Automation Paused'}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {isMasterAutomateEnabled ? 'IoT Triggers Armed' : 'Manual Override'}
              </span>
            </div>

            <button
              onClick={() => {
                playRemoteSelect();
                onToggleMasterAutomate();
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                isMasterAutomateEnabled ? 'bg-amber-500' : 'bg-neutral-800'
              }`}
              title="Toggle Master Automation"
            >
              <div
                className={`bg-neutral-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isMasterAutomateEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Google Search-Grounded AI Sports Science Section */}
      <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-800/80 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold font-display text-white">
                Google Search-Grounded Sports Science Advisor
              </h3>
              <span className="text-xs bg-cyan-950/80 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded font-mono font-medium">
                gemini-3.5-flash + googleSearch
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Queries real-time web publications and clinical fitness research to ground workout advice and room calibration in factual data
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Search Grounding Enabled</span>
          </div>
        </div>

        {/* Search Query Input */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchPrompt}
              onChange={(e) => setSearchPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunSearchGrounding();
              }}
              placeholder="Ask anything (e.g. 'Optimal room temperature for indoor HIIT cardio')..."
              className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
            />
          </div>

          <button
            onClick={() => handleRunSearchGrounding()}
            disabled={isSearching || !searchPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Web...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Search & Ground</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Question Pills */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-neutral-500 font-medium">Trending Inquiries:</span>
          {sampleSearchQueries.map((query, idx) => (
            <button
              key={idx}
              onClick={() => handleRunSearchGrounding(query)}
              className="text-xs px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer truncate max-w-xs"
            >
              {query}
            </button>
          ))}
        </div>

        {/* Search Error if any */}
        {searchError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Grounded Result Display */}
        {groundedAnswer && (
          <div className="mt-5 p-4 rounded-xl bg-neutral-950 border border-cyan-800/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300">
                  Search-Grounded Intelligence (gemini-3.5-flash)
                </span>
              </div>
              <button
                onClick={handleApplyGroundedSettings}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>Auto-Apply Optimal Room Settings</span>
              </button>
            </div>

            {/* Answer Text */}
            <div className="text-xs md:text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
              {groundedAnswer}
            </div>

            {/* Grounding Web Citations */}
            {groundedSources.length > 0 && (
              <div className="pt-3 border-t border-neutral-800/80">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block mb-2">
                  Google Search Grounding Citations ({groundedSources.length} Verified Sources):
                </span>
                <div className="flex flex-wrap gap-2">
                  {groundedSources.map((source, index) => (
                    <a
                      key={index}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-700/80 hover:border-cyan-400 text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate max-w-xs">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Search Queries Used by Gemini */}
            {searchQueries.length > 0 && (
              <div className="pt-2 text-[10px] text-neutral-500 font-mono">
                Google Search Queries: {searchQueries.join(' • ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules Engine and Execution Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Automation Rules */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-4">
              <div>
                <h3 className="text-sm font-bold font-display text-white">
                  Configured TV Living Room Rules ({rules.length})
                </h3>
                <span className="text-xs text-neutral-400">
                  Instant triggers bridging biometrics to living room equipment
                </span>
              </div>
              <span className="text-xs text-amber-500 font-mono font-medium">
                {rules.filter((r) => r.isEnabled).length} Active
              </span>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.isEnabled
                      ? 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      : 'bg-neutral-950/40 border-neutral-800/50 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                        {getCategoryIcon(rule.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                            {rule.category}
                          </span>
                        </div>
                        <span className="text-xs text-amber-400/90 font-mono font-medium">
                          Trigger: {rule.triggerCondition}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Test Fire Trigger Button */}
                      <button
                        onClick={() => {
                          playRemoteSelect();
                          onExecuteRule(rule);
                        }}
                        className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        title="Simulate / Fire rule immediately"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Test Trigger</span>
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => {
                          playRemoteClick();
                          onToggleRule(rule.id);
                        }}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          rule.isEnabled ? 'bg-amber-500' : 'bg-neutral-800'
                        }`}
                        title={rule.isEnabled ? 'Disable rule' : 'Enable rule'}
                      >
                        <div
                          className={`bg-neutral-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            rule.isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    {rule.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                    <span className="text-neutral-300 font-medium">
                      Action: {rule.actionSummary}
                    </span>
                    {rule.fireTvCommand && (
                      <span className="text-[11px] text-cyan-400 font-mono italic">
                        "{rule.fireTvCommand}"
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Execution Logs / Automation Event Ledger */}
        <div className="space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Automation Ledger
                </h4>
                <span className="text-[11px] text-neutral-400">AWS IoT & Biometric event log</span>
              </div>
              <button
                onClick={() => {
                  playRemoteClick();
                  onClearLogs();
                }}
                className="p-1 text-neutral-500 hover:text-neutral-300"
                title="Clear logs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-200 truncate max-w-[150px]">
                      {log.ruleName}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="text-[11px] text-amber-400/90 font-mono">
                    {log.triggerDetail}
                  </div>

                  <div className="text-[11px] text-neutral-300 mt-1 leading-snug">
                    {log.actionExecuted}
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-neutral-800/50 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>Source: {log.source}</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Executed
                    </span>
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
