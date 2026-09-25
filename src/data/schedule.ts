import { ScheduledWorkout } from '../types';

export const INITIAL_SCHEDULE: ScheduledWorkout[] = [
  {
    id: 'sched-1',
    time: '07:15 AM',
    label: 'Morning Spine Wakeup & Mobility',
    workoutId: 'morning-mobility-15',
    completed: true,
    type: 'Morning',
  },
  {
    id: 'sched-2',
    time: '12:45 PM',
    label: 'Midday Desk Posture Reset',
    workoutId: 'quick-posture-reset-10',
    completed: true,
    type: 'Midday',
  },
  {
    id: 'sched-3',
    time: '06:00 PM',
    label: 'Living Room Inferno HIIT (Today)',
    workoutId: 'hiit-burner-25',
    completed: false,
    type: 'Evening',
  },
  {
    id: 'sched-4',
    time: '09:45 PM',
    label: 'Pre-Bedtime Restorative Zen Yoga',
    workoutId: 'evening-restorative-yoga-20',
    completed: false,
    type: 'Night',
  },
];
