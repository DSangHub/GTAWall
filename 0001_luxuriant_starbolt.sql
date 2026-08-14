CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`auctionDeadline` bigint NOT NULL,
	`imageUrl` text,
	`mileage` varchar(64),
	`condition` varchar(64),
	`isPremium` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
