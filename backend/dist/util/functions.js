"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIsConversationParticipant = void 0;
function userIsConversationParticipant(participants, userId) {
    return !!participants.find((participant) => participant.userId === userId);
}
exports.userIsConversationParticipant = userIsConversationParticipant;
