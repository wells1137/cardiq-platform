CREATE TABLE `cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(128) NOT NULL,
	`sport` enum('NBA','NFL','MLB','NHL','EPL') NOT NULL DEFAULT 'NBA',
	`year` int,
	`brand` varchar(64),
	`set` varchar(128),
	`cardNumber` varchar(32),
	`parallel` varchar(64),
	`grade` varchar(32),
	`population` int,
	`imageUrl` text,
	`currentPrice` float,
	`avgPrice30d` float,
	`priceChange7d` float,
	`dealScore` float,
	`isDealOpportunity` boolean DEFAULT false,
	`marketSentiment` enum('bullish','neutral','bearish') DEFAULT 'neutral',
	`lastPriceUpdate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investment_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`sport` varchar(32),
	`content` text NOT NULL,
	`topDeals` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investment_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deal_alert','price_drop','scan_complete','report_ready') NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`cardId` int,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`sport` enum('NBA','NFL','MLB','NHL','EPL') NOT NULL DEFAULT 'NBA',
	`team` varchar(64),
	`position` varchar(32),
	`jerseyNumber` varchar(8),
	`imageUrl` text,
	`performanceScore` float DEFAULT 0,
	`recentStats` json,
	`lastStatsUpdate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`),
	CONSTRAINT `players_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cardId` int NOT NULL,
	`price` float NOT NULL,
	`source` enum('ebay','cardhedge','pwcc','manual') DEFAULT 'ebay',
	`saleDate` timestamp NOT NULL,
	`condition` varchar(32),
	`listingUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scan_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('pending','running','completed','failed') DEFAULT 'pending',
	`dealsFound` int DEFAULT 0,
	`cardsScanned` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` int,
	`playerId` int,
	`alertPriceBelow` float,
	`alertDealScoreAbove` float,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlist_id` PRIMARY KEY(`id`)
);
