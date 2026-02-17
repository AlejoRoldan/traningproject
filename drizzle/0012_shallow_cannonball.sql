CREATE TABLE `admin_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_admin_id` int NOT NULL,
	`to_agent_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`feedback_type` enum('note','praise','improvement','urgent','follow_up') NOT NULL DEFAULT 'note',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`is_read` int NOT NULL DEFAULT 0,
	`read_at` timestamp,
	`is_archived` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedback_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` varchar(512) NOT NULL,
	`file_type` varchar(50),
	`file_size` int,
	`uploaded_by` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedback_id` int NOT NULL,
	`from_user_id` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `micro_learning_content` MODIFY COLUMN `avgRating` varchar(10) NOT NULL DEFAULT '0';