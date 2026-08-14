ALTER TABLE `dealer_profiles` ADD `websiteUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `dealer_profiles` ADD `subscriptionPlan` enum('monthly','yearly');--> statement-breakpoint
ALTER TABLE `dealer_profiles` ADD `subscriptionStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `dealer_profiles` ADD `subscriptionEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `description` text;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `vin` varchar(20);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `year` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `make` varchar(64);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `model` varchar(64);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `color` varchar(64);