# Message composer

Messages can contain up to 120,000 characters. If a draft is longer, T3 Code keeps it in the
composer and shows how many characters need to be removed. Shorten the draft or split it into
multiple messages, then send again in the same thread.

## Answering pending questions

Pending agent questions and accepted answers are saved with the thread. If the server restarts
before an accepted answer is delivered, T3 Code restores it from the saved question. When the
provider's original callback has disappeared, your question and answer are queued as a continuation
in the same conversation, using the thread's selected provider and permission mode.

Only one answer is accepted for each question. Answers for questions superseded by a newer turn
are rejected. If a disconnect happens during delivery and T3 Code cannot confirm the outcome,
it keeps your answer and shows a delivery warning. Check the conversation before explicitly
continuing. Recovery does not grant tool approval or complete a login on your behalf.
