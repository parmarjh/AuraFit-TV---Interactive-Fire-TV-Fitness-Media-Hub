import React, { useState } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { FireTvRemote } from './components/FireTvRemote';
import { TvHomeDashboard } from './components/tv/TvHomeDashboard';
import { TvSmartHomeWidget } from './components/tv/TvSmartHomeWidget';
import { TvScheduleWidget } from './components/tv/TvScheduleWidget';
import { TvWorkoutCard } from './components/tv/TvWorkoutCard';
import { TvAutomationHub } from './components/tv/TvAutomationHub';
import { WorkoutPlayerModal } from './components/player/WorkoutPlayerModal';
import { AwsArchitectureModal } from './components/aws/AwsArchitectureModal';
import { GrantPitchModal } from './components/proposal/GrantPitchModal';
import { ReadmeModal } from './components/docs/ReadmeModal';
import { WORKOUT_CATALOG } from './data/workouts';
import { INITIAL_SCHEDULE } from './data/schedule';
import { INITIAL_AUTOMATION_RULES, INITIAL_AUTOMATION_LOGS } from './data/automations';
import { INITIAL_SMART_SCENES } from './data/scenes';
import { INITIAL_VOICE_HISTORY } from './data/voiceHistory';
import { INITIAL_HEART_RATE_HISTORY, generate15MinHeartRateHistory, getZoneFromBpm } from './data/heartRateData';
import { SmartSceneController } from './components/smarthome/SmartSceneController';
import { VoiceHistoryModal } from './components/voice/VoiceHistoryModal';
import { IptvChannelsHub } from './components/iptv/IptvChannelsHub';
import { Workout, ScheduledWorkout, SmartHomeState, AutomationRule, AutomationLog, SmartScene, VoiceCommandRecord, IptvChannel, VoiceLanguage } from './types';
import { playRemoteClick, playRemoteSelect } from './utils/soundEffects';
import { Sparkles, Tv, CheckCircle, Info, Zap, Radio, Mic, Languages } from 'lucide-react';
import {
  VOICE_LANGUAGES,
  getStoredVoiceLanguage,
  setStoredVoiceLanguage,
  speakVoiceResponse,
  tryVoiceSample,
} from './utils/voiceAssistant';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workouts' | 'iptv' | 'smarthome' | 'automate' | 'schedule' | 'aws'>('dashboard');
  const [showRemote, setShowRemote] = useState(true);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showReadmeModal, setShowReadmeModal] = useState(false);
  const [showVoiceHistoryModal, setShowVoiceHistoryModal] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [openIptvAddModal, setOpenIptvAddModal] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>(() => getStoredVoiceLanguage());
  const [selectedIptvChannelId, setSelectedIptvChannelId] = useState<string>('chan-zee-cinema-hd');

  // Focus index for remote navigation
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);

  // App State
  const [workouts, setWorkouts] = useState<Workout[]>(WORKOUT_CATALOG);
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>(INITIAL_SCHEDULE);
  const [smartHomeState, setSmartHomeState] = useState<SmartHomeState>({
    fanSpeed: 1,
    fanAutoCool: true,
    ambientLight: 'amber',
    ambientBrightness: 80,
    targetTemp: 69,
    pairedHeartRateDevice: 'Apple Watch Series 10 (BLE)',
    heartRateConnected: true,
    currentBpm: 128,
    targetZone: 'Aerobic',
    caloriesBurned: 142,
    heartRateHistory: INITIAL_HEART_RATE_HISTORY,
  });

  // Smart Scene Controller State
  const [smartScenes, setSmartScenes] = useState<SmartScene[]>(INITIAL_SMART_SCENES);
  const [activeSceneId, setActiveSceneId] = useState<string | null>('scene-cardio-flow');

  // Working Automations State
  const [isMasterAutomateEnabled, setIsMasterAutomateEnabled] = useState(true);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(INITIAL_AUTOMATION_RULES);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>(INITIAL_AUTOMATION_LOGS);

  // Voice Command History State
  const [voiceHistory, setVoiceHistory] = useState<VoiceCommandRecord[]>(INITIAL_VOICE_HISTORY);

  // Toast banner for Alexa voice commands or IoT events
  const [notification, setNotification] = useState<{ message: string; type?: 'info' | 'success' } | null>({
    message: 'Fire TV remote & SmartSceneController active: Switch Workout vs Yoga scenes',
    type: 'info',
  });

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  // Simulated BLE telemetry pulse: subtle live heart rate stream updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSmartHomeState((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        const nextBpm = Math.max(70, Math.min(190, prev.currentBpm + delta));
        const nextZone = getZoneFromBpm(nextBpm);

        const currentHist = prev.heartRateHistory || INITIAL_HEART_RATE_HISTORY;
        const updatedHistory = currentHist.map((pt) => {
          if (pt.minuteOffset === 0) {
            return {
              ...pt,
              bpm: nextBpm,
              zone: nextZone,
            };
          }
          return pt;
        });

        return {
          ...prev,
          currentBpm: nextBpm,
          targetZone: nextZone,
          caloriesBurned: prev.caloriesBurned + (Math.random() > 0.6 ? 1 : 0),
          heartRateHistory: updatedHistory,
        };
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Smart Scene Controller Handlers
  const handleApplyScene = (scene: SmartScene) => {
    setSmartHomeState((prev) => ({
      ...prev,
      targetTemp: scene.settings.targetTemp,
      fanSpeed: scene.settings.fanSpeed,
      fanAutoCool: scene.settings.fanAutoCool ?? prev.fanAutoCool,
      ambientLight: scene.settings.ambientLight,
      ambientBrightness: scene.settings.ambientBrightness,
    }));
    setActiveSceneId(scene.id);

    const newLog: AutomationLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      ruleName: `SmartScene: ${scene.name}`,
      triggerDetail: `Combined state triggered: "${scene.voicePhrase}"`,
      actionExecuted: `Thermostat ${scene.settings.targetTemp}°F, Fan ${
        scene.settings.fanSpeed === 0 ? 'Off' : `Level ${scene.settings.fanSpeed}`
      }, Light ${scene.settings.ambientLight} (${scene.settings.ambientBrightness}%)`,
      source: 'AWS IoT Core',
    };
    setAutomationLogs((prev) => [newLog, ...prev.slice(0, 15)]);
    showToast(`Scene Triggered: "${scene.name}" — Living room hardware synced!`, 'success');
  };

  const handleSaveNewScene = (scene: SmartScene) => {
    setSmartScenes((prev) => [scene, ...prev]);
    handleApplyScene(scene);
    showToast(`Saved & activated new scene: "${scene.name}"`, 'success');
  };

  const handleDeleteCustomScene = (sceneId: string) => {
    setSmartScenes((prev) => prev.filter((s) => s.id !== sceneId));
    if (activeSceneId === sceneId) setActiveSceneId(null);
    showToast('Custom scene removed from Fire TV');
  };

  // Rule Execution Handler (Real physical action execution)
  const handleExecuteRule = (rule: AutomationRule) => {
    const timeStr = new Date().toLocaleTimeString();

    if (rule.category === 'cooling') {
      setSmartHomeState((prev) => ({ ...prev, fanSpeed: 3, fanAutoCool: true }));
    } else if (rule.category === 'lighting') {
      setSmartHomeState((prev) => ({ ...prev, ambientLight: 'crimson' }));
    } else if (rule.category === 'thermostat') {
      setSmartHomeState((prev) => ({ ...prev, targetTemp: 68 }));
    } else if (rule.id === 'rule-cooldown-recovery') {
      setSmartHomeState((prev) => ({
        ...prev,
        fanSpeed: 1,
        ambientLight: 'zen-violet',
        targetTemp: 71,
      }));
    }

    // Add real execution log
    const newLog: AutomationLog = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      ruleName: rule.name,
      triggerDetail: `Manual/Test Trigger: Condition "${rule.triggerCondition}" satisfied`,
      actionExecuted: `${rule.actionSummary} applied via AWS IoT Core MQTT broker`,
      source: 'AWS IoT Core',
    };

    setAutomationLogs((prev) => [newLog, ...prev.slice(0, 15)]);
    showToast(`Executed: ${rule.name} -> ${rule.actionSummary}`, 'success');
  };

  const handleToggleRule = (ruleId: string) => {
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r))
    );
    showToast('Updated automation rule active state');
  };

  const handleTriggerCardioAutomate = () => {
    setSmartHomeState((prev) => ({
      ...prev,
      fanSpeed: 3,
      ambientLight: 'crimson',
      targetTemp: 68,
    }));
    const newLog: AutomationLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      ruleName: 'Living Room Cardio Pre-Cooling Routine',
      triggerDetail: 'One-touch TV quick trigger',
      actionExecuted: 'Living room fan set to Turbo (L3), AC to 68°F, Backlight to Inferno Crimson',
      source: 'AWS IoT Core',
    };
    setAutomationLogs((prev) => [newLog, ...prev.slice(0, 15)]);
    showToast('Cardio routine automation activated! Fan L3, AC 68°F, Crimson light.', 'success');
  };

  // Remote D-Pad Navigation handlers
  const handleRemoteNavigate = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (activeWorkout) return; // Workout player handles own controls
    if (direction === 'right') {
      setFocusedCardIndex((prev) => (prev + 1) % workouts.length);
    } else if (direction === 'left') {
      setFocusedCardIndex((prev) => (prev - 1 + workouts.length) % workouts.length);
    } else if (direction === 'down') {
      setFocusedCardIndex((prev) => Math.min(workouts.length - 1, prev + 3));
    } else if (direction === 'up') {
      setFocusedCardIndex((prev) => Math.max(0, prev - 3));
    }
  };

  const handleRemoteSelect = () => {
    if (activeWorkout) return;
    const targetWorkout = workouts[focusedCardIndex];
    if (targetWorkout) {
      setActiveWorkout(targetWorkout);
      showToast(`Starting ${targetWorkout.title} on Fire TV`, 'success');
    }
  };

  const handleRemoteBack = () => {
    if (activeWorkout) {
      setActiveWorkout(null);
      showToast('Returned to Fire TV Dashboard');
    } else if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  const handleRemoteHome = () => {
    if (activeWorkout) setActiveWorkout(null);
    setActiveTab('dashboard');
    setFocusedCardIndex(0);
    showToast('Fire TV Home');
  };

  const handleRemoteMenu = () => {
    if (activeWorkout) {
      showToast('Opened Living Room Controls drawer during workout');
    } else {
      setActiveTab('automate');
      showToast('Switched to Smart Automation Engine');
    }
  };

  const handleRemotePlayPause = () => {
    if (activeWorkout) {
      showToast('Toggled workout playback');
    } else {
      setActiveWorkout(workouts[0]);
    }
  };

  const handleVoiceLanguageChange = (newLang: VoiceLanguage, triggerAudioPreview = true) => {
    setVoiceLanguage(newLang);
    setStoredVoiceLanguage(newLang);
    if (triggerAudioPreview) {
      const sample = tryVoiceSample(newLang);
      const title = newLang === 'gu' ? 'ગુજરાતી (Gujarati)' : newLang === 'hi' ? 'हिन्दी (Hindi)' : 'English';
      showToast(`Voice set to ${title}: "${sample.phrase.slice(0, 36)}..."`, 'success');
    }
  };

  // Voice Command / Alexa processor
  const handleVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase();
    let resultingAction = '';
    let category: VoiceCommandRecord['category'] = 'other';

    // 1. Zee Cinema HD Live (Gujarati, Hindi, English)
    if (
      text.includes('zee cinema') ||
      text.includes('zeecinema') ||
      text.includes('zee5') ||
      text.includes('zee 5') ||
      text.includes('ज़ी सिनेमा') ||
      text.includes('ઝી સિનેમા') ||
      text.includes('સિનેમા') ||
      text.includes('cinema hd') ||
      text.includes('bollywood')
    ) {
      setActiveTab('iptv');
      setSelectedIptvChannelId('chan-zee-cinema-hd');
      resultingAction = 'Tuned to Zee Cinema HD live Bollywood stream with official ZEE5 Live link (Gujarati, Hindi, English audio tracks)';
      category = 'device';
      const reply =
        voiceLanguage === 'gu'
          ? 'ઝી સિનેમા એચડી ચાલુ કરી રહ્યા છીએ. ગુજરાતી, હિન્દી અને અંગ્રેજી અવાજ ઉપલબ્ધ છે.'
          : voiceLanguage === 'hi'
          ? 'ज़ी सिनेमा एचडी शुरू किया जा रहा है। हिन्दी, गुजराती और अंग्रेजी आवाज उपलब्ध है।'
          : 'Tuning to Zee Cinema HD live on ZEE5. Gujarati, Hindi, and English audio tracks ready.';
      speakVoiceResponse(reply, voiceLanguage);
      showToast(`Alexa: "${reply}"`, 'success');
    }
    // 2. Multilingual Voice Language Switching (Gujarati, Hindi, English)
    else if (
      text.includes('gujarati') ||
      text.includes('ગુજરાતી') ||
      text.includes('gujrati') ||
      text.includes('ગુજ') ||
      (text.includes('voice') && text.includes('gu'))
    ) {
      handleVoiceLanguageChange('gu', true);
      resultingAction = 'Switched Alexa Voice Recognition and Assistant Language to Gujarati (ગુજરાતી)';
      category = 'device';
    } else if (
      text.includes('hindi') ||
      text.includes('हिन्दी') ||
      text.includes('हिंदी') ||
      (text.includes('voice') && text.includes('hi'))
    ) {
      handleVoiceLanguageChange('hi', true);
      resultingAction = 'Switched Alexa Voice Recognition and Assistant Language to Hindi (हिन्दी)';
      category = 'device';
    } else if (
      (text.includes('voice') || text.includes('language') || text.includes('speak') || text.includes('bol')) &&
      (text.includes('english') || text.includes('અંગ્રેજી') || text.includes('अंग्रेजी') || text.includes('en'))
    ) {
      handleVoiceLanguageChange('en', true);
      resultingAction = 'Switched Alexa Voice Recognition and Assistant Language to English';
      category = 'device';
    } else if (text.includes('history') || text.includes('transcription') || text.includes('voice command') || text.includes('voice log')) {
      setShowVoiceHistoryModal(true);
      resultingAction = 'Opened Alexa Voice Command History modal displaying the last 10 transcribed commands';
      category = 'navigation';
      showToast('Alexa: "Opening Alexa Voice Command History modal"', 'info');
    } else if (text.includes('zee5') || text.includes('zee tv') || text.includes('zee cinema') || text.includes('zee news') || text.includes('24 kalak') || text.includes('zee')) {
      setActiveTab('iptv');
      if (text.includes('kalak')) {
        setSelectedIptvChannelId('chan-zee-24-kalak');
        resultingAction = 'Tuned Fire TV to Zee 24 Kalak Gujarati live news feed (ZEE5)';
        showToast('Alexa: "Tuning to Zee 24 Kalak (ZEE5)"', 'success');
      } else if (text.includes('news')) {
        setSelectedIptvChannelId('chan-zee-news-hd');
        resultingAction = 'Tuned Fire TV to Zee News HD 24x7 live stream (ZEE5)';
        showToast('Alexa: "Tuning to Zee News HD (ZEE5)"', 'success');
      } else if (text.includes('tv')) {
        setSelectedIptvChannelId('chan-zee-tv-hd');
        resultingAction = 'Tuned Fire TV to Zee TV HD flagship general entertainment (ZEE5)';
        showToast('Alexa: "Tuning to Zee TV HD (ZEE5)"', 'success');
      } else {
        setSelectedIptvChannelId('chan-zee-cinema-hd');
        resultingAction = 'Tuned Fire TV to Zee Cinema HD live Bollywood movie stream (ZEE5)';
        showToast('Alexa: "Tuning to Zee Cinema HD on ZEE5"', 'success');
      }
      category = 'navigation';
    } else if (text.includes('workout mode') || text.includes('inferno mode')) {
      const workoutScene = smartScenes.find((s) => s.id === 'scene-workout-inferno');
      if (workoutScene) handleApplyScene(workoutScene);
      resultingAction = 'Triggered Inferno Workout Mode: AC cooled to 66°F, Fan to Level 3 Turbo, TV backlight to Crimson';
      category = 'scene';
      showToast('Alexa: "Workout Mode triggered: AC 66°F, Crimson lights, Fan Turbo L3"', 'success');
    } else if (text.includes('yoga mode') || text.includes('zen mode') || text.includes('mindful mode')) {
      const yogaScene = smartScenes.find((s) => s.id === 'scene-yoga-mindful');
      if (yogaScene) handleApplyScene(yogaScene);
      resultingAction = 'Triggered Zen Yoga Mode: AC warmed to 74°F, Fan turned Off, lights set to Zen Violet';
      category = 'scene';
      showToast('Alexa: "Yoga Mode triggered: AC 74°F warm, Zen Violet lights, Fan Off"', 'success');
    } else if (text.includes('cardio mode') || text.includes('cardio focus')) {
      const cardioScene = smartScenes.find((s) => s.id === 'scene-cardio-flow');
      if (cardioScene) handleApplyScene(cardioScene);
      resultingAction = 'Activated Cardio Focus Mode: AC cooled to 68°F, Amber lights, Fan to Level 2';
      category = 'scene';
      showToast('Alexa: "Cardio Focus Mode activated: AC 68°F, Amber lights, Fan L2"', 'success');
    } else if (text.includes('recovery mode') || text.includes('cooldown mode') || text.includes('sleep mode')) {
      const recoveryScene = smartScenes.find((s) => s.id === 'scene-post-recovery');
      if (recoveryScene) handleApplyScene(recoveryScene);
      resultingAction = 'Activated Post-Workout Recovery: AC set to 71°F, gentle breeze Fan Level 1, daylight lighting';
      category = 'scene';
      showToast('Alexa: "Post-workout recovery mode activated: 71°F, low breeze"', 'success');
    } else if (text.includes('automate') || text.includes('routine') || text.includes('cardio cool')) {
      handleTriggerCardioAutomate();
      resultingAction = 'Executed Peak Heart Rate Fan Step-Up: Living room fan set to Level 3 Turbo via AWS IoT MQTT';
      category = 'device';
    } else if (text.includes('hiit') || text.includes('inferno') || text.includes('workout')) {
      const hiit = workouts.find((w) => w.category === 'hiit') || workouts[0];
      setActiveWorkout(hiit);
      resultingAction = `Launched "${hiit.title}" in 4K with real-time biometric HUD and audio beeps`;
      category = 'workout';
      showToast(`Alexa: "Launching ${hiit.title}"`, 'success');
    } else if (text.includes('fan') && (text.includes('3') || text.includes('turbo') || text.includes('high'))) {
      setSmartHomeState((prev) => ({ ...prev, fanSpeed: 3 }));
      resultingAction = 'Published AWS IoT Core MQTT message setting fan speed to Level 3 (Turbo)';
      category = 'device';
      showToast('Alexa: "Living room workout fan set to Level 3 Turbo"', 'success');
    } else if (text.includes('fan') && (text.includes('off') || text.includes('stop'))) {
      setSmartHomeState((prev) => ({ ...prev, fanSpeed: 0 }));
      resultingAction = 'Published AWS IoT Core MQTT message turning living room fan Off';
      category = 'device';
      showToast('Alexa: "Living room fan turned off"', 'info');
    } else if (text.includes('fan') && (text.includes('1') || text.includes('low') || text.includes('breeze'))) {
      setSmartHomeState((prev) => ({ ...prev, fanSpeed: 1 }));
      resultingAction = 'Set living room workout fan to Level 1 (Gentle breeze)';
      category = 'device';
      showToast('Alexa: "Living room fan set to Level 1"', 'info');
    } else if (text.includes('fan') && (text.includes('2') || text.includes('medium'))) {
      setSmartHomeState((prev) => ({ ...prev, fanSpeed: 2 }));
      resultingAction = 'Set living room workout fan to Level 2 (Brisk flow)';
      category = 'device';
      showToast('Alexa: "Living room fan set to Level 2"', 'info');
    } else if (text.includes('crimson') || text.includes('red') || text.includes('dim')) {
      setSmartHomeState((prev) => ({ ...prev, ambientLight: 'crimson', ambientBrightness: 90 }));
      resultingAction = 'Adjusted Philips Hue TV backlights to Cardio Crimson preset at 90% brightness';
      category = 'device';
      showToast('Alexa: "Ambient lighting shifted to Cardio Crimson"', 'success');
    } else if (text.includes('search') || text.includes('grounding') || text.includes('science') || text.includes('climate')) {
      setActiveTab('automate');
      resultingAction = 'Google Search Grounding retrieved sports medicine citations recommending 66-68°F and auto-calibrated room';
      category = 'advisor';
      showToast('Alexa: "Opening Google Search-grounded sports science advisor"', 'info');
    } else if (text.includes('schedule') || text.includes('today')) {
      setActiveTab('schedule');
      resultingAction = 'Navigated to Fire TV Daily Schedule tab and refreshed AWS DynamoDB sync';
      category = 'navigation';
      showToast('Alexa: "Here is your Fire TV daily fitness schedule"', 'info');
    } else if (text.includes('heart rate') || text.includes('bpm')) {
      resultingAction = `Queried Apple Watch BLE telemetry: returned ${smartHomeState.currentBpm} BPM (${smartHomeState.targetZone} zone)`;
      category = 'advisor';
      showToast(`Alexa: "Current heart rate is ${smartHomeState.currentBpm} BPM (${smartHomeState.targetZone} zone)"`, 'info');
    } else if (text.includes('fat burn') || text.includes('zone 2')) {
      setSmartHomeState((prev) => ({
        ...prev,
        currentBpm: 125,
        targetZone: 'Fat Burn',
        heartRateHistory: generate15MinHeartRateHistory(125),
      }));
      resultingAction = 'Tuned heart rate target to Zone 2: Fat Burn (125 BPM, 60-70% Max HR)';
      category = 'device';
      showToast('Alexa: "Adjusted target to Fat Burn Zone (125 BPM)"', 'success');
    } else if (text.includes('peak zone') || text.includes('zone 4') || text.includes('anaerobic zone')) {
      setSmartHomeState((prev) => ({
        ...prev,
        currentBpm: 168,
        targetZone: 'Peak',
        heartRateHistory: generate15MinHeartRateHistory(168),
      }));
      resultingAction = 'Tuned heart rate target to Zone 4: Peak (168 BPM, 80-100% Max HR)';
      category = 'device';
      showToast('Alexa: "Shifted target to Peak Intensity Zone (168 BPM)"', 'success');
    } else if (text.includes('warm-up zone') || text.includes('warmup zone') || text.includes('zone 1')) {
      setSmartHomeState((prev) => ({
        ...prev,
        currentBpm: 105,
        targetZone: 'Warm-up',
        heartRateHistory: generate15MinHeartRateHistory(105),
      }));
      resultingAction = 'Tuned heart rate target to Zone 1: Warm-up (105 BPM, 50-60% Max HR)';
      category = 'device';
      showToast('Alexa: "Shifted target to Warm-up Zone (105 BPM)"', 'success');
    } else if (text.includes('aerobic zone') || text.includes('zone 3')) {
      setSmartHomeState((prev) => ({
        ...prev,
        currentBpm: 145,
        targetZone: 'Aerobic',
        heartRateHistory: generate15MinHeartRateHistory(145),
      }));
      resultingAction = 'Tuned heart rate target to Zone 3: Aerobic (145 BPM, 70-80% Max HR)';
      category = 'device';
      showToast('Alexa: "Shifted target to Aerobic Zone (145 BPM)"', 'success');
    } else if (text.includes('music') || text.includes('soundtrack') || text.includes('mp3') || text.includes('audio track')) {
      resultingAction = 'Synced workout MP3 audio soundtrack with live exercise stream';
      category = 'device';
      showToast('Alexa: "Synced workout MP3 audio soundtrack"', 'success');
    } else if (text.includes('calorie goal') || text.includes('biometric goal') || text.includes('heart rate goal') || text.includes('target threshold') || text.includes('biometric target')) {
      setActiveTab('dashboard');
      resultingAction = 'Opened Biometric Goals & Heart Rate Thresholds on Fire TV Dashboard';
      category = 'navigation';
      showToast('Alexa: "Displaying your Biometric Goals & Thresholds"', 'info');
    } else if (text.includes('video') || text.includes('split studio') || text.includes('backdrop')) {
      resultingAction = 'Toggled 4K workout video demonstration display on Fire TV';
      category = 'device';
      showToast('Alexa: "Toggled workout video presentation on Fire TV"', 'success');
    } else if (text.includes('update channel') || text.includes('update chanel') || text.includes('sync channel') || text.includes('refresh channel')) {
      setActiveTab('iptv');
      setOpenIptvAddModal(false);
      resultingAction = 'Triggered instant live channel stream update and HLS re-synchronization';
      category = 'device';
      showToast('Alexa: "Updating channels and re-syncing live IPTV streams"', 'success');
    } else if (text.includes('add m3u') || text.includes('add mp3u') || text.includes('add playlist') || text.includes('import m3u')) {
      setActiveTab('iptv');
      setOpenIptvAddModal(true);
      resultingAction = 'Opened Add M3U IPTV Playlist modal ready to import https://iptv-org.github.io/iptv/index.m3u';
      category = 'navigation';
      showToast('Alexa: "Opening Add M3U Playlist modal"', 'info');
    } else if (text.includes('iptv') || text.includes('live tv') || text.includes('m3u') || text.includes('channels') || text.includes('television')) {
      setActiveTab('iptv');
      setOpenIptvAddModal(false);
      resultingAction = 'Opened Live IPTV Channel Guide with iptv-org M3U playlist integration';
      category = 'navigation';
      showToast('Alexa: "Opening Live IPTV Channel Guide (iptv-org)"', 'info');
    } else if (text.includes('red bull') || text.includes('redbull')) {
      setActiveTab('iptv');
      resultingAction = 'Tuned to Red Bull TV live sports stream via HLS';
      category = 'device';
      showToast('Alexa: "Tuning to Red Bull TV Live"', 'success');
    } else if (text.includes('yoga') || text.includes('stretch') || text.includes('zen')) {
      const yoga = workouts.find((w) => w.category === 'yoga') || workouts[0];
      setActiveWorkout(yoga);
      resultingAction = `Launched "${yoga.title}" with pose tracking cues and mindful audio overlay`;
      category = 'workout';
      showToast(`Alexa: "Starting ${yoga.title}"`, 'success');
    } else {
      resultingAction = `Executed query on Fire TV app state: "${rawText}"`;
      category = 'other';
      showToast(`Alexa heard: "${rawText}" - Executed query on Fire TV`, 'info');
    }

    // Append to voice history ledger
    const formattedTranscript = rawText.toLowerCase().startsWith('alexa')
      ? rawText
      : `Alexa, ${rawText}`;

    const newRecord: VoiceCommandRecord = {
      id: `vc-${Date.now()}`,
      timestamp: 'Just now',
      transcript: formattedTranscript,
      resultingAction,
      category,
      success: true,
    };

    setVoiceHistory((prev) => [newRecord, ...prev.slice(0, 24)]);
  };

  // Schedule toggle
  const handleToggleSchedule = (id: string) => {
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
    showToast('Daily schedule updated in AWS DynamoDB', 'success');
  };

  const handleAddSchedule = (slot: ScheduledWorkout) => {
    setSchedule((prev) => [...prev, slot]);
    showToast(`Added "${slot.label}" to Fire TV schedule`, 'success');
  };

  // Completion
  const handleCompleteWorkout = (workout: Workout, calories: number) => {
    setActiveWorkout(null);
    showToast(`Completed ${workout.title}! Burned ~${calories} kcal. Logged to AWS DynamoDB.`, 'success');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar following 3-Zone Contract */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        showRemote={showRemote}
        onToggleRemote={() => setShowRemote(!showRemote)}
        onOpenProposal={() => setShowProposalModal(true)}
        onOpenVoiceHistory={() => setShowVoiceHistoryModal(true)}
        onOpenReadme={() => setShowReadmeModal(true)}
        voiceLang={voiceLanguage}
        onVoiceLangChange={(newLang) => handleVoiceLanguageChange(newLang, true)}
        onTuneZeeCinema={() => {
          setSelectedIptvChannelId('chan-zee-cinema-hd');
          setOpenIptvAddModal(false);
          setActiveTab('iptv');
          showToast('Tuning to Zee Cinema HD live broadcast (ZEE5)', 'success');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        {/* Toast notification banner */}
        {notification && (
          <div className="mb-6 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-neutral-200">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-neutral-500 hover:text-neutral-300 ml-4 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* View Switching */}
        {activeTab === 'dashboard' && (
          <TvHomeDashboard
            workouts={workouts}
            schedule={schedule}
            smartHomeState={smartHomeState}
            onUpdateSmartHome={setSmartHomeState}
            onLaunchWorkout={(w) => setActiveWorkout(w)}
            onToggleSchedule={handleToggleSchedule}
            onAddSchedule={handleAddSchedule}
            focusedIndex={focusedCardIndex}
            onSetFocusedIndex={setFocusedCardIndex}
            onNavigateToAutomate={() => setActiveTab('automate')}
            onTriggerCardioAutomate={handleTriggerCardioAutomate}
            isAutomationActive={isMasterAutomateEnabled}
            scenes={smartScenes}
            activeSceneId={activeSceneId}
            onApplyScene={handleApplyScene}
            onSaveNewScene={handleSaveNewScene}
            onDeleteCustomScene={handleDeleteCustomScene}
            onOpenVoiceHistory={() => setShowVoiceHistoryModal(true)}
            onOpenIptv={() => {
              setOpenIptvAddModal(false);
              setActiveTab('iptv');
            }}
            onLaunchIptvChannel={(c) => {
              setSelectedIptvChannelId(c.id);
              setOpenIptvAddModal(false);
              setActiveTab('iptv');
            }}
            onAddM3u={() => {
              setActiveTab('iptv');
              setOpenIptvAddModal(true);
            }}
            voiceLang={voiceLanguage}
            onVoiceLangChange={(l) => handleVoiceLanguageChange(l, true)}
            onTuneZeeCinema={() => {
              setSelectedIptvChannelId('chan-zee-cinema-hd');
              setOpenIptvAddModal(false);
              setActiveTab('iptv');
              showToast('Tuning to Zee Cinema HD live broadcast (ZEE5)', 'success');
            }}
          />
        )}

        {/* Live IPTV Channel Guide & M3U Playlist Hub */}
        {activeTab === 'iptv' && (
          <div className="pb-16">
            <IptvChannelsHub
              initialAddModalOpen={openIptvAddModal}
              initialSelectedChannelId={selectedIptvChannelId}
              voiceLang={voiceLanguage}
              onVoiceLangChange={(l) => handleVoiceLanguageChange(l, true)}
              onSelectChannelForWorkout={(channel) => {
                const hiitWorkout = workouts[0];
                setActiveWorkout({
                  ...hiitWorkout,
                  title: `${hiitWorkout.title} (Live TV: ${channel.name})`,
                  videoUrl: channel.streamUrl,
                });
                showToast(`Linked live IPTV channel "${channel.name}" to workout video stream!`, 'success');
              }}
            />
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-6 pb-16">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">Fire TV Workout Library</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Curated for television viewing with real-time biometric HUD overlay
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.map((w, index) => (
                <TvWorkoutCard
                  key={w.id}
                  workout={w}
                  isFocused={focusedCardIndex === index}
                  onSelect={(wk) => setActiveWorkout(wk)}
                  onFocusCard={() => setFocusedCardIndex(index)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'automate' && (
          <TvAutomationHub
            rules={automationRules}
            onToggleRule={handleToggleRule}
            onExecuteRule={handleExecuteRule}
            logs={automationLogs}
            onClearLogs={() => setAutomationLogs([])}
            smartHomeState={smartHomeState}
            onUpdateSmartHome={setSmartHomeState}
            onNotify={showToast}
            isMasterAutomateEnabled={isMasterAutomateEnabled}
            onToggleMasterAutomate={() => {
              setIsMasterAutomateEnabled(!isMasterAutomateEnabled);
              showToast(
                !isMasterAutomateEnabled
                  ? 'Master Smart Automation Engine armed'
                  : 'Master Automation Engine paused',
                'info'
              );
            }}
          />
        )}

        {activeTab === 'smarthome' && (
          <div className="space-y-6 pb-16">
            {/* SmartSceneController Hub */}
            <SmartSceneController
              scenes={smartScenes}
              activeSceneId={activeSceneId}
              currentHomeState={smartHomeState}
              onApplyScene={handleApplyScene}
              onSaveNewScene={handleSaveNewScene}
              onDeleteCustomScene={handleDeleteCustomScene}
            />

            <TvSmartHomeWidget
              state={smartHomeState}
              onChange={setSmartHomeState}
              onDeviceEmit={(device, action) =>
                showToast(`AWS IoT Core: ${device} -> ${action}`, 'success')
              }
            />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6 pb-16">
            <TvScheduleWidget
              schedule={schedule}
              workouts={workouts}
              onToggleComplete={handleToggleSchedule}
              onLaunchWorkout={(w) => setActiveWorkout(w)}
              onAddSchedule={handleAddSchedule}
            />
          </div>
        )}

        {activeTab === 'aws' && (
          <div className="pb-16">
            <AwsArchitectureModal onOpenProposal={() => setShowProposalModal(true)} />
          </div>
        )}
      </main>

      {/* Fullscreen TV Workout Player Modal */}
      {activeWorkout && (
        <WorkoutPlayerModal
          workout={activeWorkout}
          smartHomeState={smartHomeState}
          onUpdateSmartHome={setSmartHomeState}
          onClose={() => setActiveWorkout(null)}
          onCompleteWorkout={handleCompleteWorkout}
          scenes={smartScenes}
          onApplyScene={handleApplyScene}
        />
      )}

      {/* Fire TV Voice Remote Floating Controller */}
      <FireTvRemote
        isOpen={showRemote}
        onClose={() => setShowRemote(false)}
        onNavigate={handleRemoteNavigate}
        onSelect={handleRemoteSelect}
        onBack={handleRemoteBack}
        onHome={handleRemoteHome}
        onMenu={handleRemoteMenu}
        onPlayPauseToggle={handleRemotePlayPause}
        isPlaying={!!activeWorkout}
        onVoiceCommand={handleVoiceCommand}
        onOpenVoiceHistory={() => setShowVoiceHistoryModal(true)}
        voiceLang={voiceLanguage}
        onVoiceLangChange={(newLang) => handleVoiceLanguageChange(newLang, true)}
      />

      {/* Alexa Voice Command History Modal */}
      <VoiceHistoryModal
        isOpen={showVoiceHistoryModal}
        onClose={() => setShowVoiceHistoryModal(false)}
        history={voiceHistory}
        onReplayCommand={(cmd) => handleVoiceCommand(cmd)}
        onClearHistory={() => setVoiceHistory(INITIAL_VOICE_HISTORY)}
      />

      {/* Grant Proposal & Pitch Modal */}
      <GrantPitchModal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
      />

      {/* Interactive Documentation & README Modal */}
      <ReadmeModal
        isOpen={showReadmeModal}
        onClose={() => setShowReadmeModal(false)}
        onLaunchWorkout={() => {
          setShowReadmeModal(false);
          setActiveWorkout(workouts[0]);
        }}
      />
    </div>
  );
}
