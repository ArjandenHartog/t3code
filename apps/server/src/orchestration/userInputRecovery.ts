import {
  ApprovalRequestId,
  ProviderInstanceId,
  UserInputQuestion,
  type OrchestrationThreadActivity,
} from "@t3tools/contracts";
import * as Schema from "effect/Schema";
import * as Option from "effect/Option";

export const UserInputRequestPayload = Schema.Struct({
  requestId: ApprovalRequestId,
  providerInstanceId: Schema.optional(ProviderInstanceId),
  questions: Schema.Array(UserInputQuestion),
});

const decodeUserInputRequest = Schema.decodeUnknownOption(UserInputRequestPayload);

export function findUserInputRequest(
  activities: ReadonlyArray<OrchestrationThreadActivity>,
  requestId: string,
) {
  for (const activity of activities.toReversed()) {
    if (activity.kind !== "user-input.requested") continue;
    const payload = decodeUserInputRequest(activity.payload);
    if (Option.isSome(payload) && payload.value.requestId === requestId) {
      return { activity, ...payload.value };
    }
  }
  return undefined;
}

export function userInputRecoveryText(
  questions: ReadonlyArray<UserInputQuestion>,
  answers: Readonly<Record<string, unknown>>,
) {
  return [
    "The pending user-input callback was lost when this session disconnected. Here are my answers to the original questions. Continue the existing task using these answers; this is not permission to bypass approval or authentication requirements.",
    ...questions.map((question) =>
      JSON.stringify({
        question: question.question,
        questionId: question.id,
        answer: answers[question.id],
      }),
    ),
  ].join("\n\n");
}
