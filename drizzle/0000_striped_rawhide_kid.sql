CREATE TABLE `destination_likes` (
	`country` text NOT NULL,
	`visitor` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`country`, `visitor`),
	FOREIGN KEY (`visitor`) REFERENCES `like_visitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `like_visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
