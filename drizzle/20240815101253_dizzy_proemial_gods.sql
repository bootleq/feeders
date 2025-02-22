CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`bounds` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`userId` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`docType` text NOT NULL,
	`docId` text NOT NULL,
	`scope` text NOT NULL,
	`whodunnit` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spotFollowups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`spotState` text NOT NULL,
	`desc` text,
	`material` text,
	`feedeeCount` integer,
	`state` text DEFAULT 'draft' NOT NULL,
	`spawnedAt` integer,
	`removedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`spotId` integer,
	`userId` text,
	FOREIGN KEY (`spotId`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`lat` real NOT NULL,
	`lon` real NOT NULL,
	`city` text,
	`town` text,
	`geohash` text NOT NULL,
	`desc` text,
	`state` text DEFAULT 'draft' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`userId` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`state` text DEFAULT 'new' NOT NULL,
	`desc` text,
	`image` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lockedAt` integer
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE INDEX `doc` ON `changes` (`docType`,`docId`,`scope`);--> statement-breakpoint
CREATE INDEX `geohash` ON `spots` (`geohash`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);