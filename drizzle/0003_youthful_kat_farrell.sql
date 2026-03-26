ALTER TABLE `scan_jobs` ADD `triggeredBy` enum('manual','auto') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `scan_jobs` ADD `watchlistHits` int DEFAULT 0;