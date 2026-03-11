export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  videoIntro?: string;
  bio?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    neighbourhood?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  skills: { name: string; proficiency: string; availability: string }[];
  interests: string[];
  rating: number;
  reviewCount: number;
  exchangeCount: number;
  trustScore: number;
  role: 'user' | 'admin' | 'moderator';
  isVerified: boolean;
  groups: Group[];
  createdAt: string;
}

export interface Post {
  _id: string;
  author: Pick<User, '_id' | 'name' | 'avatar' | 'rating'>;
  type: 'skill' | 'tool' | 'event' | 'question' | 'general';
  title: string;
  content: string;
  images: string[];
  tags: string[];
  group?: Pick<Group, '_id' | 'name' | 'avatar'>;
  upvotes: string[];
  downvotes: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  userVote?: 'up' | 'down' | null;
}

export interface Exchange {
  _id: string;
  requester: Pick<User, '_id' | 'name' | 'avatar' | 'rating'>;
  provider?: Pick<User, '_id' | 'name' | 'avatar' | 'rating'>;
  type: 'skill' | 'tool' | 'service';
  title: string;
  description: string;
  offering: string;
  seeking: string;
  status: 'open' | 'pending' | 'active' | 'completed' | 'cancelled';
  scheduledDate?: string;
  completedDate?: string;
  ceuValue: number;
  images: string[];
  tags: string[];
  messages: ExchangeMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeMessage {
  sender: string;
  content: string;
  timestamp: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  type: 'public' | 'private' | 'restricted';
  category: string;
  admin: Pick<User, '_id' | 'name' | 'avatar'>;
  moderators: Pick<User, '_id' | 'name' | 'avatar'>[];
  members: {
    user: Pick<User, '_id' | 'name' | 'avatar'>;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: string;
  }[];
  memberCount: number;
  tags: string[];
  createdAt: string;
}

export interface Message {
  _id: string;
  group: string;
  sender: Pick<User, '_id' | 'name' | 'avatar'>;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  replyTo?: Message;
  reactions: { emoji: string; users: string[] }[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, '_id' | 'name' | 'email' | 'avatar' | 'role' | 'location'>;
}
