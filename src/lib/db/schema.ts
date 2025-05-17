import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  pin: text("pin"),
  pattern: text("pattern"),
  displayName: text("display_name"),
  avatar: text("avatar"),
  lastSeen: timestamp("last_seen"),
  isOnline: boolean("is_online").default(false),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export const message = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  senderId: text("sender_id").notNull(),
  content: text("content"),
  attachment: text("attachment"),
  repliedTo: text("replied_to"),
});

export const linkPreview = pgTable("link_preview", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  messageId: text("message_id").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  image: text("image"),
});

export const userRelations = relations(user, ({ many }) => ({
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
  preview: one(linkPreview, {
    fields: [message.id],
    references: [linkPreview.messageId],
  }),
}));

export const linkPreviewRelations = relations(linkPreview, ({ one }) => ({
  message: one(message, {
    fields: [linkPreview.messageId],
    references: [message.id],
  }),
}));
