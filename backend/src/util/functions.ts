import { ParticipantPopulated } from "./types";

export function userIsConversationParticipant(
	participants: Array<ParticipantPopulated>,
	userId: string
): boolean {
	// convert object into boolean
	return !!participants.find((participant) => participant.userId === userId)
}
