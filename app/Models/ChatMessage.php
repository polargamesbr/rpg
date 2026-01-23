<?php

namespace App\Models;

use App\Services\UuidService;

class ChatMessage
{
    /**
     * Create a new chat message
     */
    public static function create(array $data): int
    {
        // Sanitize message
        $data['message'] = self::validateMessage($data['message']);
        
        return Database::insert('chat_messages', $data);
    }

    /**
     * Find messages by room name
     * Returns last N messages with character and class data
     */
    public static function findByRoom(string $roomName, int $limit = 100): array
    {
        $limit = max(1, min(100, (int)$limit)); // Ensure limit is between 1 and 100
        
        $sql = "SELECT 
                    cm.id,
                    cm.uuid,
                    cm.message,
                    cm.created_at,
                    c.id as character_id,
                    c.uuid as character_uuid,
                    c.name as character_name,
                    c.level as character_level,
                    c.gender as character_gender,
                    c.entity_id as class_name
                FROM chat_messages cm
                INNER JOIN characters c ON cm.character_id = c.id
                INNER JOIN chat_rooms cr ON cm.chat_room_id = cr.id
                WHERE cr.name = :room_name
                ORDER BY cm.created_at DESC
                LIMIT {$limit}";
        
        $messages = Database::fetchAll($sql, [
            'room_name' => $roomName
        ]);
        
        // Reverse to show oldest first
        return array_reverse($messages);
    }

    /**
     * Find messages newer than a specific UUID
     * Used for polling - optimized query
     */
    public static function findNewerThan(string $roomName, string $lastMessageUuid): array
    {
        // Optimized: Use a single query with subquery instead of two queries
        $sql = "SELECT 
                    cm.id,
                    cm.uuid,
                    cm.message,
                    cm.created_at,
                    c.id as character_id,
                    c.uuid as character_uuid,
                    c.name as character_name,
                    c.level as character_level,
                    c.gender as character_gender,
                    c.entity_id as class_name
                FROM chat_messages cm
                INNER JOIN characters c ON cm.character_id = c.id
                INNER JOIN chat_rooms cr ON cm.chat_room_id = cr.id
                WHERE cr.name = :room_name
                AND cm.created_at > (
                    SELECT created_at 
                    FROM chat_messages 
                    WHERE uuid = :last_uuid 
                    LIMIT 1
                )
                ORDER BY cm.created_at ASC
                LIMIT 50";
        
        $result = Database::fetchAll($sql, [
            'room_name' => $roomName,
            'last_uuid' => $lastMessageUuid
        ]);
        
        // If no result, last message might not exist, return empty
        return $result ?: [];
    }

    /**
     * Get room ID by name
     */
    public static function getRoomId(string $roomName): ?int
    {
        $room = Database::fetchOne(
            "SELECT id FROM chat_rooms WHERE name = :name LIMIT 1",
            ['name' => $roomName]
        );
        
        return $room ? (int)$room['id'] : null;
    }

    /**
     * Validate and sanitize message
     * - Remove HTML tags
     * - Limit to 1000 characters
     * - Trim whitespace
     * - Normalize whitespace
     */
    public static function validateMessage(string $message): string
    {
        // Trim whitespace
        $message = trim($message);
        
        // Remove all HTML tags for security
        $message = strip_tags($message);
        
        // Normalize whitespace (multiple spaces to single space)
        $message = preg_replace('/\s+/', ' ', $message);
        
        // Limit to 1000 characters
        if (mb_strlen($message) > 1000) {
            $message = mb_substr($message, 0, 1000);
        }
        
        return $message;
    }

    /**
     * Check if message is valid (not empty after sanitization)
     * Minimum length: 1 character
     */
    public static function isValid(string $message): bool
    {
        $sanitized = self::validateMessage($message);
        $length = mb_strlen($sanitized);
        return $length >= 1 && $length <= 1000;
    }

    /**
     * Check if message is too short (spam prevention)
     */
    public static function isTooShort(string $message): bool
    {
        $sanitized = self::validateMessage($message);
        return mb_strlen($sanitized) < 1;
    }

    /**
     * Check progressive rate limiting for a character
     * Progressive penalties: 3s, 5s, 10s, 20s, 30s, 60s
     * Returns: ['allowed' => bool, 'wait_seconds' => int, 'message' => string, 'penalty_level' => int]
     */
    public static function checkRateLimit(int $characterId): array
    {
        // Get messages from last 60 seconds to calculate rate
        $recentMessages = Database::fetchAll(
            "SELECT created_at FROM chat_messages 
             WHERE character_id = :character_id 
             AND created_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
             ORDER BY created_at DESC",
            ['character_id' => $characterId]
        );
        
        $messageCount = count($recentMessages);
        
        // Progressive rate limiting based on message frequency
        // If sending more than 1 message per 3 seconds on average, apply penalties
        $averageInterval = $messageCount > 0 ? 60 / $messageCount : 999;
        
        // Determine penalty level based on rate
        $penaltyLevel = 0;
        $waitSeconds = 0;
        
        if ($messageCount >= 20) { // 20+ messages in 60s = 1 msg per 3s
            $penaltyLevel = 6;
            $waitSeconds = 60;
        } elseif ($messageCount >= 12) { // 12+ messages = 1 msg per 5s
            $penaltyLevel = 5;
            $waitSeconds = 30;
        } elseif ($messageCount >= 6) { // 6+ messages = 1 msg per 10s
            $penaltyLevel = 4;
            $waitSeconds = 20;
        } elseif ($messageCount >= 3) { // 3+ messages = 1 msg per 20s
            $penaltyLevel = 3;
            $waitSeconds = 10;
        } elseif ($messageCount >= 2) { // 2+ messages = 1 msg per 30s
            $penaltyLevel = 2;
            $waitSeconds = 5;
        } elseif ($messageCount >= 1) { // 1+ message
            $penaltyLevel = 1;
            $waitSeconds = 3;
        }
        
        // Check if last message was sent too recently based on penalty level
        if ($penaltyLevel > 0 && !empty($recentMessages)) {
            $lastMessage = $recentMessages[0];
            $lastTime = strtotime($lastMessage['created_at']);
            $currentTime = time();
            $timeSinceLast = $currentTime - $lastTime;
            
            if ($timeSinceLast < $waitSeconds) {
                $remainingWait = $waitSeconds - $timeSinceLast;
                return [
                    'allowed' => false,
                    'wait_seconds' => $remainingWait,
                    'message' => '', // No error message - button countdown is enough
                    'penalty_level' => $penaltyLevel
                ];
            }
        }
        
        return ['allowed' => true, 'wait_seconds' => 0, 'message' => '', 'penalty_level' => 0];
    }

    /**
     * Basic profanity filter (can be expanded)
     */
    public static function containsProfanity(string $message): bool
    {
        $sanitized = mb_strtolower(self::validateMessage($message));
        
        // Basic list (can be expanded or moved to database)
        $badWords = [
            // Add words here as needed
        ];
        
        foreach ($badWords as $word) {
            if (mb_strpos($sanitized, $word) !== false) {
                return true;
            }
        }
        
        return false;
    }
}

