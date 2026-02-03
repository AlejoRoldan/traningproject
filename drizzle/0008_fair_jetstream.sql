CREATE TABLE `response_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('informative','transactional','fraud','money_laundering','theft','complaint','credit','digital_channels') NOT NULL,
	`type` enum('opening','development','objection_handling','closing','empathy','protocol') NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`context` text,
	`tags` text,
	`complexity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `response_templates_id` PRIMARY KEY(`id`)
);
