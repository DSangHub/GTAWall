CREATE TABLE `buyer_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`userId` int,
	`make` varchar(64),
	`model` varchar(64),
	`maxPrice` int,
	`minYear` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buyer_alerts_id` PRIMARY KEY(`id`)
);
