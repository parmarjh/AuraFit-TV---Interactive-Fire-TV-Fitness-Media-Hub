export interface WorkoutAudioTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  audioUrl: string;
  durationFormatted: string;
  description: string;
}

export const WORKOUT_AUDIO_TRACKS: WorkoutAudioTrack[] = [
  {
    id: 'track-edm-inferno',
    title: 'Inferno Velocity (Workout Mix)',
    artist: 'AuraFit Studio Beats',
    genre: 'Electronic Dance / HIIT',
    bpm: 138,
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverending_Story.mp3',
    durationFormatted: '3:45',
    description: 'High-tempo driving synth leads and heavy kicks optimized for HIIT interval cadence.',
  },
  {
    id: 'track-synthwave-pulse',
    title: 'Neon Horizon Cardio Flow',
    artist: 'Retrowave Collective',
    genre: 'Synthwave / Steady State',
    bpm: 126,
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3',
    durationFormatted: '4:12',
    description: 'Chunky analog basslines and rhythmic arpeggios ideal for fat burn and aerobic pacing.',
  },
  {
    id: 'track-electro-dynamo',
    title: 'Hyperdrive Power Circuit',
    artist: 'Epoq Studio',
    genre: 'Breakbeat / Power Strength',
    bpm: 144,
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.mp3',
    durationFormatted: '3:50',
    description: 'Energetic breakbeats with motivational drops designed for maximum caloric burn.',
  },
  {
    id: 'track-zen-ambient',
    title: 'Serenity Breath & Recovery',
    artist: 'Zenith Soundscapes',
    genre: 'Ambient / Mindful Yoga',
    bpm: 72,
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race1.ogg',
    durationFormatted: '4:30',
    description: 'Gentle harmonic pads and binaural frequencies for lowering cortisol and blood pressure.',
  },
];
