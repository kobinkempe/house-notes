CREATE TABLE `ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`source` text DEFAULT 'brainstorm' NOT NULL,
	`status` text DEFAULT 'candidate' NOT NULL,
	`interest` text DEFAULT 'consider' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ideas_status_category_sort` ON `ideas` (`status`,`category`,`sort_order`);--> statement-breakpoint
CREATE TABLE `inspiration_images` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inspiration_images_object_key_unique` ON `inspiration_images` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_inspiration_images_created` ON `inspiration_images` (`created_at`);