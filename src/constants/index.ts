export const APP_NAME = "MKT Viral Content Platform";

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  WAITING_ROOM: "/waiting-room",
  CONTENT_LIBRARY: "/library",
  CONTENT_DETAIL: "/library/:id",
  PROFILE: "/profile",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_TOPICS: "/admin/topics",
  ADMIN_CONTENTS: "/admin/contents",
  ADMIN_CONTENT_NEW: "/admin/contents/new",
  ADMIN_CONTENT_EDIT: "/admin/contents/:id/edit",
  ADMIN_BANNERS: "/admin/banners",
  ADMIN_PROGRAM_BANNERS: "/admin/program-banners",
} as const;

export const USER_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  SALES: "sales",
} as const;

export const TOPIC_STATUS = {
  ACTIVE: "active",
  HIDDEN: "hidden",
} as const;
