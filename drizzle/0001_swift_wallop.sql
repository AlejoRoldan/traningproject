CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`category` enum('performance','streak','completion','ranking','special') DEFAULT 'performance',
	`xpBonus` int DEFAULT 0,
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `daily_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`simulationsCount` int NOT NULL DEFAULT 0,
	`avgScore` decimal(5,2) DEFAULT '0.00',
	`xpEarned` int NOT NULL DEFAULT 0,
	CONSTRAINT `daily_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `library_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('empatia','resolucion','protocolo','productos','manejo_objeciones','ventas','cobranzas') NOT NULL,
	`type` enum('guia','video','procedimiento','checklist','ficha','referencia') NOT NULL,
	`content` text,
	`externalUrl` text,
	`readingMinutes` int DEFAULT 5,
	`rating` decimal(3,1) DEFAULT '0.0',
	`totalRatings` int DEFAULT 0,
	`views` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `library_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('reclamos','productos','ventas','cobranzas','onboarding','fraude') NOT NULL,
	`difficulty` enum('facil','medio','dificil','experto') NOT NULL,
	`xpReward` int NOT NULL DEFAULT 100,
	`durationMin` int NOT NULL DEFAULT 5,
	`durationMax` int NOT NULL DEFAULT 10,
	`clientName` varchar(128),
	`clientPersona` text,
	`clientTone` enum('neutral','molesto','urgente','amable','desconfiado','ansioso') DEFAULT 'neutral',
	`clientGender` enum('masculino','femenino') DEFAULT 'masculino',
	`initialMessage` text NOT NULL,
	`systemPrompt` text NOT NULL,
	`idealResponseHints` text,
	`empathyWeight` decimal(3,2) DEFAULT '0.20',
	`clarityWeight` decimal(3,2) DEFAULT '0.20',
	`protocolWeight` decimal(3,2) DEFAULT '0.20',
	`resolutionWeight` decimal(3,2) DEFAULT '0.20',
	`professionalismWeight` decimal(3,2) DEFAULT '0.20',
	`competencies` json,
	`totalCompleted` int NOT NULL DEFAULT 0,
	`avgScore` decimal(5,2) DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulation_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('agent','client') NOT NULL,
	`content` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`audioUrl` text,
	CONSTRAINT `simulation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`isPracticeMode` boolean NOT NULL DEFAULT false,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`durationSeconds` int,
	`overallScore` int,
	`empathyScore` int,
	`clarityScore` int,
	`protocolScore` int,
	`resolutionScore` int,
	`professionalismScore` int,
	`xpEarned` int NOT NULL DEFAULT 0,
	`strengths` json,
	`weaknesses` json,
	`recommendations` json,
	`aiFeedbackSummary` text,
	`audioUrl` text,
	`transcription` text,
	CONSTRAINT `simulation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`supervisorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`sessionId` int,
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`requiredSimulations` int NOT NULL DEFAULT 5,
	`completedSimulations` int NOT NULL DEFAULT 0,
	`completedDays` json DEFAULT ('[]'),
	CONSTRAINT `weekly_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('gerente','supervisor','coordinador','analista','agente','admin') NOT NULL DEFAULT 'agente';--> statement-breakpoint
ALTER TABLE `users` ADD `teamId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `xpTotal` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `level` enum('junior','intermedio','senior','experto') DEFAULT 'junior' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `currentStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `maxStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastActivityDate` timestamp;