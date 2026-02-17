interface Common {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageData {
  scale: number;
  info: string;
  xPos: number;
  yPos: number;
  alt: string;
}

export interface ImageBase extends ImageData {
  id: string;
  src: string;
  size: number;
  order: number;
  width: number;
  height: number;
  ownerId: string;
  mimetype: string;
  createdAt: string;
  updatedAt: string;
}

export interface Image extends ImageBase {
  owner: User;
}

export type NewImageData = Partial<ImageData & { isAvatar: boolean }>;

export interface ProfileBase {
  id: string;
  visible: boolean;
  tangible: boolean;
  lastSeen: string;
  followedByCurrentUser?: boolean;
}

export interface User extends Common {
  bio: string;
  order: number;
  username: string;
  fullname: string;
  isAdmin: boolean;
  profile: ProfileBase;
  avatar?: { image: ImageBase } | null;
}

export interface Profile extends ProfileBase {
  user: User;
}
