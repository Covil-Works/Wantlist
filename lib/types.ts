export type Visibility = "public" | "invited" | "private";

export type Profile = {
  id: string;
  firebase_uid: string;
  display_name: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type Wishlist = {
  id: string;
  owner_id: string;
  title: string;
  public_code: string;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  owner_name?: string;
};

export type Item = {
  id: string;
  wishlist_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  original_url: string | null;
  domain: string | null;
  podium_position: 1 | 2 | 3 | null;
  created_revision: number;
  created_at: string;
  updated_at: string;
  reserved: boolean;
  reserved_by_me?: boolean;
  is_new?: boolean;
};

export type NotificationType = "new_items" | "item_reserved" | "podium_item_reserved";

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  href: string;
  created_at: string;
  read_at: string | null;
};
