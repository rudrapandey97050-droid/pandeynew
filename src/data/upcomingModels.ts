import { UpcomingModel, PopupSettings } from '../types.ts';

export const initialPopupSettings: PopupSettings = {
  isEnabled: false,
  delaySeconds: 2,
  mode: 'single',
  heading: 'COMING SOON / UPCOMING FLAGSHIP',
  subheading: 'Official Pre-Booking Now Open at Pandey Mobile Store'
};

// Clean initial upcoming models - No demo models
export const initialUpcomingModels: UpcomingModel[] = [];
