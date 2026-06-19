export type Profile = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  avatar_color: string | null
  created_at: string
  plan: 'free' | 'pro'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export type Board = {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export type BoardMember = {
  id: string
  board_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export type PostType = 'note' | 'tasks' | 'question'

export type MapLocation = {
  lat: number
  lng: number
  label: string
}

export type Post = {
  id: string
  board_id: string
  author_id: string
  type: PostType
  title: string | null
  content: string | null
  image_url: string | null
  map_location: MapLocation | null
  pos_x: number
  pos_y: number
  rotation: number
  reply_to_post_id: string | null
  label_color: 'red' | 'blue' | 'green' | 'pink' | 'grey' | null
  created_at: string
  updated_at: string
}

export type TaskItem = {
  id: string
  post_id: string
  label: string
  checked: boolean
  position: number
  created_at: string
  updated_at: string
}


export type Reaction = {
  id: string
  post_id: string
  user_id: string
  emoji: string
  created_at: string
}

export type Sticker = {
  id: string
  board_id: string
  created_by: string
  image_src: string
  pos_x: number
  pos_y: number
  rotation: number
  created_at: string
}

export type BoardShare = {
  id: string
  board_id: string
  created_by: string
  token: string
  created_at: string
}

export type BoardInvite = {
  id: string
  board_id: string
  invited_email: string
  invited_by: string
  token: string
  accepted: boolean
  created_at: string
}

export type ReplyPost = Post & { author: Profile }

export type PostWithRelations = Post & {
  author: Profile
  task_items?: TaskItem[]
  reactions?: Reaction[]
  replies?: ReplyPost[]
}

export type BoardMemberWithProfile = BoardMember & {
  profile: Profile
}

export type BoardCalendarEvent = {
  id: string
  board_id: string
  author_id: string
  title: string
  start_date: string
  end_date: string
  color: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      boards: {
        Row: Board
        Insert: Omit<Board, 'id' | 'created_at'>
        Update: Partial<Omit<Board, 'id' | 'created_at'>>
      }
      board_members: {
        Row: BoardMember
        Insert: Omit<BoardMember, 'id' | 'joined_at'>
        Update: Partial<Omit<BoardMember, 'id' | 'joined_at'>>
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Post, 'id' | 'created_at'>>
      }
      task_items: {
        Row: TaskItem
        Insert: Omit<TaskItem, 'id' | 'created_at'>
        Update: Partial<Omit<TaskItem, 'id' | 'created_at'>>
      }
      reactions: {
        Row: Reaction
        Insert: Omit<Reaction, 'id' | 'created_at'>
        Update: Partial<Omit<Reaction, 'id' | 'created_at'>>
      }
      board_invites: {
        Row: BoardInvite
        Insert: Omit<BoardInvite, 'id' | 'created_at' | 'token'>
        Update: Partial<Omit<BoardInvite, 'id' | 'created_at'>>
      }
      stickers: {
        Row: Sticker
        Insert: Omit<Sticker, 'id' | 'created_at'>
        Update: Partial<Omit<Sticker, 'id' | 'created_at'>>
      }
    }
  }
}
