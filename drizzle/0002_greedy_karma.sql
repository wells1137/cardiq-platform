CREATE TABLE `scan_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`hour` int NOT NULL DEFAULT 8,
	`minute` int NOT NULL DEFAULT 0,
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Shanghai',
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`dealScoreThreshold` float NOT NULL DEFAULT 70,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scan_schedule_id` PRIMARY KEY(`id`)
);
