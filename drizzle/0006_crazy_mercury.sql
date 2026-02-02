CREATE TABLE `audio_markers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`simulationId` int NOT NULL,
	`createdBy` int NOT NULL,
	`timestamp` int NOT NULL,
	`category` enum('excellent','good','needs_improvement','critical_error') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audio_markers_id` PRIMARY KEY(`id`)
);
