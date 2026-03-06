CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(100) NOT NULL DEFAULT 'Momento de reflexión',
	`message` text,
	`timeOfDay` varchar(5) NOT NULL,
	`daysOfWeek` json NOT NULL DEFAULT ('[1,3,5]'),
	`isActive` boolean NOT NULL DEFAULT true,
	`timezone` varchar(50) DEFAULT 'UTC',
	`lastTriggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
