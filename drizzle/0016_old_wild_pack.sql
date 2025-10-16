CREATE TABLE `ai_collaboration_modes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mode` text NOT NULL,
	`is_active` integer DEFAULT 0 NOT NULL,
	`configuration` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_activated_at` integer
);
--> statement-breakpoint
CREATE TABLE `mode_capabilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mode` text NOT NULL,
	`local_ai` integer DEFAULT 0 NOT NULL,
	`external_ai` integer DEFAULT 0 NOT NULL,
	`multi_channel` integer DEFAULT 0 NOT NULL,
	`offline_capable` integer DEFAULT 0 NOT NULL,
	`real_time_sync` integer DEFAULT 0 NOT NULL,
	`mcp_server_ids` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mode_capabilities_mode_unique` ON `mode_capabilities` (`mode`);--> statement-breakpoint
CREATE TABLE `mode_transition_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_mode` text,
	`to_mode` text NOT NULL,
	`context_snapshot` text,
	`transition_duration` integer,
	`success` integer DEFAULT 1 NOT NULL,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
