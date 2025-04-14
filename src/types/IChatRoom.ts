export interface ChatRoom {
  id: string;
  name: string;
  userCount: number;
  createdAt: Date;
  creatorId?: string;      
  creatorUsername?: string;
}