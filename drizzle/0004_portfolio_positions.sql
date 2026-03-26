CREATE TABLE `portfolio_positions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `cardId` int NOT NULL,
  `quantity` float NOT NULL DEFAULT 1,
  `averageCost` float NOT NULL,
  `targetPrice` float,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `portfolio_positions_id` PRIMARY KEY(`id`)
);
