<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\CharacterService;
use App\Models\ChatMessage;
use App\Services\UuidService;

class ChatController
{
    /**
     * Send a chat message
     * POST /game/chat/send
     */
    public function send(): void
    {
        // Check authentication
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
            return;
        }

        // Get active character
        $character = CharacterService::getActiveCharacter();
        if (!$character) {
            jsonResponse(['success' => false, 'error' => 'No active character'], 400);
            return;
        }

        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        $room = trim($input['room'] ?? '');
        $message = trim($input['message'] ?? '');

        // Validation
        if (empty($room)) {
            jsonResponse(['success' => false, 'error' => 'Room name is required'], 400);
            return;
        }

        // Get room ID first
        $roomId = ChatMessage::getRoomId($room);
        if (!$roomId) {
            jsonResponse(['success' => false, 'error' => 'Invalid chat room'], 400);
            return;
        }

        // Validate message is not empty (don't use empty() as it considers "0" as empty)
        $trimmedMessage = trim($message);
        if ($trimmedMessage === '') {
            jsonResponse(['success' => false, 'error' => 'Message cannot be empty'], 400);
            return;
        }

        // Sanitize message
        $sanitizedMessage = ChatMessage::validateMessage($message);

        // Validate message length and content
        if (ChatMessage::isTooShort($sanitizedMessage)) {
            jsonResponse(['success' => false, 'error' => 'Message is too short'], 400);
            return;
        }

        if (!ChatMessage::isValid($sanitizedMessage)) {
            jsonResponse(['success' => false, 'error' => 'Invalid message. Maximum 1000 characters.'], 400);
            return;
        }

        // Removed: repeated characters check (allows "kkkkk", "hahaha", etc.)
        // Removed: duplicate message check (user can send same message if they want)

        // Check for profanity (optional - can be disabled)
        if (ChatMessage::containsProfanity($sanitizedMessage)) {
            jsonResponse(['success' => false, 'error' => 'Message contains inappropriate content'], 400);
            return;
        }

        // Progressive rate limiting
        $rateLimit = ChatMessage::checkRateLimit($character['id']);
        if (!$rateLimit['allowed']) {
            // Return wait_seconds but no error message - button countdown is enough
            jsonResponse([
                'success' => false, 
                'error' => '', // No error message - button countdown is enough
                'wait_seconds' => $rateLimit['wait_seconds'],
                'penalty_level' => $rateLimit['penalty_level'] ?? 0
            ], 429);
            return;
        }

        // Create message
        try {
            $messageData = [
                'uuid' => UuidService::generate(),
                'chat_room_id' => $roomId,
                'character_id' => $character['id'],
                'message' => $sanitizedMessage // Use sanitized message
            ];

            ChatMessage::create($messageData);

            // Get the created message with character data
            $createdMessage = \App\Models\Database::fetchOne(
                "SELECT 
                    cm.id,
                    cm.uuid,
                    cm.message,
                    cm.created_at,
                    c.id as character_id,
                    c.uuid as character_uuid,
                    c.name as character_name,
                    c.level as character_level,
                    c.gender as character_gender,
                    cl.name as class_name,
                    cl.display_name as class_display_name,
                    cl.image_prefix as class_image_prefix
                FROM chat_messages cm
                INNER JOIN characters c ON cm.character_id = c.id
                INNER JOIN classes cl ON c.class_id = cl.id
                WHERE cm.uuid = :uuid
                LIMIT 1",
                ['uuid' => $messageData['uuid']]
            );

            jsonResponse([
                'success' => true,
                'message' => $createdMessage
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Error sending message: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get messages for a room
     * GET /game/chat/messages?room=tavern&limit=100
     */
    public function messages(): void
    {
        // Check authentication
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $room = $_GET['room'] ?? 'tavern';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $limit = max(1, min(100, $limit)); // Clamp between 1 and 100

        try {
            $messages = ChatMessage::findByRoom($room, $limit);
            
            jsonResponse([
                'success' => true,
                'messages' => $messages
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Error fetching messages: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Poll for new messages
     * GET /game/chat/poll?room=tavern&last_uuid=xxx
     * Optimized for low server load
     */
    public function poll(): void
    {
        // Check authentication
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $room = $_GET['room'] ?? 'tavern';
        $lastUuid = $_GET['last_uuid'] ?? '';

        if (empty($lastUuid)) {
            // If no last_uuid, return empty array (client should use /messages first)
            jsonResponse([
                'success' => true,
                'messages' => []
            ]);
            return;
        }

        try {
            // Optimized query - only fetch new messages
            $messages = ChatMessage::findNewerThan($room, $lastUuid);
            
            // Return empty array if no new messages (reduces response size)
            jsonResponse([
                'success' => true,
                'messages' => $messages
            ]);
        } catch (\Exception $e) {
            // Log error but return empty array to prevent client errors
            error_log('Chat polling error: ' . $e->getMessage());
            jsonResponse([
                'success' => true,
                'messages' => []
            ]);
        }
    }
}

