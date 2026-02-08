CREATE TABLE `buddy_pairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId1` int NOT NULL,
	`agentId2` int NOT NULL,
	`status` enum('suggested','accepted','active','completed','declined') NOT NULL DEFAULT 'suggested',
	`matchScore` int,
	`matchReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`completedAt` timestamp,
	`sharedGoal` text,
	`targetWeeks` int NOT NULL DEFAULT 4,
	CONSTRAINT `buddy_pairs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`supervisorId` int,
	`type` enum('low_performance','stagnation','improvement','milestone') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`status` enum('pending','acknowledged','resolved') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	CONSTRAINT `coaching_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`weaknessAnalysis` text,
	`strengthsAnalysis` text,
	`priorityAreas` text,
	`recommendedScenarios` text,
	`weeklyGoal` text,
	`estimatedWeeks` int,
	`completedScenarios` text,
	`progress` int NOT NULL DEFAULT 0,
	CONSTRAINT `coaching_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentId` int NOT NULL,
	`status` enum('started','in_progress','completed') NOT NULL DEFAULT 'started',
	`progressPercent` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`timeSpent` int NOT NULL DEFAULT 0,
	`rating` int,
	`feedback` text,
	CONSTRAINT `learning_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `micro_learning_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('video','article','quiz','infographic') NOT NULL,
	`url` varchar(500),
	`duration` int,
	`thumbnail` varchar(500),
	`category` enum('informative','transactional','fraud','money_laundering','theft','complaint','credit','digital_channels'),
	`skill` varchar(100),
	`level` enum('basico','intermedio','avanzado','experto') NOT NULL DEFAULT 'basico',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`viewCount` int NOT NULL DEFAULT 0,
	`avgRating` decimal(3,2) NOT NULL DEFAULT '0',
	CONSTRAINT `micro_learning_content_id` PRIMARY KEY(`id`)
);
