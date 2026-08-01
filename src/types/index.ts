export enum Platform {
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
}

export type View =
  | 'dashboard'
  | 'analytics'
  | 'create-post'
  | 'settings'
  | 'scheduler'
  | 'predictor';

export interface ViewProps {
  onNavigate?: (view: View) => void;
}
