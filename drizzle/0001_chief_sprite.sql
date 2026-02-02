CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`category` enum('empathy','protocol','resolution','crisis','speed','consistency') NOT NULL,
	`criteria` text NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `improvement_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`generatedBy` enum('automatic','supervisor','trainer') NOT NULL,
	`createdBy` int NOT NULL,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`weaknessAreas` text,
	`recommendedScenarios` text,
	`goals` text,
	`progress` int NOT NULL DEFAULT 0,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`targetDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `improvement_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`simulationId` int NOT NULL,
	`role` enum('agent','client','system') NOT NULL,
	`content` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`evaluationNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`category` enum('informative','transactional','fraud','money_laundering','theft','complaint','credit','digital_channels') NOT NULL,
	`complexity` int NOT NULL,
	`estimatedDuration` int NOT NULL,
	`systemPrompt` text NOT NULL,
	`clientProfile` text NOT NULL,
	`evaluationCriteria` text NOT NULL,
	`idealResponse` text,
	`tags` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`duration` int,
	`transcript` text,
	`overallScore` int,
	`categoryScores` text,
	`feedback` text,
	`strengths` text,
	`weaknesses` text,
	`recommendations` text,
	`pointsEarned` int DEFAULT 0,
	`badgesEarned` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`department` varchar(100) NOT NULL,
	`supervisorId` int,
	`period` enum('daily','weekly','monthly') NOT NULL,
	`periodDate` timestamp NOT NULL,
	`totalSimulations` int NOT NULL DEFAULT 0,
	`averageScore` int,
	`topPerformers` text,
	`commonWeaknesses` text,
	`improvementRate` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`simulationId` int,
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','agent','supervisor','trainer') NOT NULL DEFAULT 'agent';--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `supervisorId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `level` enum('junior','intermediate','senior','expert') DEFAULT 'junior';--> statement-breakpoint
ALTER TABLE `users` ADD `points` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `badges` text;