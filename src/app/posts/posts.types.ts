import { User, Image } from '../app.types';

export interface Tag {
  id: string;
  name: string;
  postId: Post['id'];
}

export interface Comment {
  id: string;
  order: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  postId: Post['id'];
  authorId: User['id'];
  author: User;
}

export interface Vote {
  id: string;
  order: number;
  isUpvote: boolean;
  createdAt: string;
  updatedAt: string;
  userId: User['id'];
  postId: Post['id'];
  user: User;
}

export interface Post {
  id: string;
  order: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  comments: Comment[];
  authorId: User['id'];
  author: User;
  tags: Tag[];
  votes: Vote[];
  image: Image | null;
  imageId: Image['id'] | null;
  upvotedByCurrentUser: boolean;
  downvotedByCurrentUser: boolean;
  _count: { votes: number; comments: number; downvotes: number; upvotes: number };
}
