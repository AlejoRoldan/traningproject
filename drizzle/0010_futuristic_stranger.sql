CREATE TABLE `team_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamName` varchar(100) NOT NULL,
	`department` varchar(100) NOT NULL,
	`area` varchar(100),
	`managerId` int,
	`supervisorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_assignments_id` PRIMARY KEY(`id`)
);
