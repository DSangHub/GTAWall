CREATE TABLE `dealer_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dealerName` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(32) NOT NULL,
	`maxVehicles` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealer_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `dealer_profiles_userId_unique` UNIQUE(`userId`)
);
