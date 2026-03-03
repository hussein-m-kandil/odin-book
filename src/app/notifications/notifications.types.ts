import { Profile } from '../app.types';

export interface Notification {
  id: string;
  url: string;
  header: string;
  createdAt: string;
  profileName: string;
  profileId: string | null;
  description: string | null;
  profile: Profile | null;
  seenAt: string | null;
}
