CREATE TABLE `consent_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consentType` varchar(50) NOT NULL,
	`granted` boolean NOT NULL,
	`version` varchar(20) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consent_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crisis_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`severity` enum('low','medium','high') NOT NULL,
	`resourceShown` varchar(200),
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crisis_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`tokensUsed` int,
	`flaggedForReview` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reflections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` int,
	`title` varchar(200),
	`content` text NOT NULL,
	`tags` json DEFAULT ('[]'),
	`isPinned` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reflections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('web','telegram','mobile') DEFAULT 'web',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`moodPre` smallint,
	`moodPost` smallint,
	`messageCount` int DEFAULT 0,
	`durationSeconds` int,
	`crisisTriggered` boolean DEFAULT false,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`communicationStyle` enum('empathetic','direct','analytical','creative') DEFAULT 'empathetic',
	`notificationFrequency` enum('daily','weekly','none') DEFAULT 'none',
	`timezone` varchar(50) DEFAULT 'UTC',
	`language` varchar(10) DEFAULT 'es',
	`personalGoals` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `consentVersion` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `consentTimestamp` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `dataRetentionDays` int DEFAULT 365;--> statement-breakpoint
ALTER TABLE `users` ADD `deletedAt` timestamp;