PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_factPicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`factIds` text DEFAULT '[]' NOT NULL,
	`title` text,
	`desc` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`publishedAt` integer,
	`userId` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_factPicks`("id", "state", "factIds", "title", "desc", "createdAt", "userId") SELECT "id", "state", "factIds", "title", "desc", "createdAt", "userId" FROM `factPicks`;--> statement-breakpoint
DROP TABLE `factPicks`;--> statement-breakpoint
ALTER TABLE `__new_factPicks` RENAME TO `factPicks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;