CREATE TABLE `factPicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`factIds` text,
	`title` text,
	`desc` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`userId` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
