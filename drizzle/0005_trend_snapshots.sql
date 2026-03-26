CREATE TABLE `trend_snapshots` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cardId` int NOT NULL,
  `trend` enum('bullish','neutral','bearish') NOT NULL,
  `confidence` int NOT NULL,
  `compositeScore` int NOT NULL,
  `source` enum('scan','detail','manual') NOT NULL DEFAULT 'scan',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `trend_snapshots_id` PRIMARY KEY(`id`)
);
