import * as Effect from "effect/Effect";
import * as SqlClient from "effect/unstable/sql/SqlClient";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  // Callback validation must read durable event ordering, not provider-local
  // activity sequence numbers or the retained 500-entry timeline window.
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_orchestration_events_request_lookup
    ON orchestration_events (stream_id, json_extract(metadata_json, '$.requestId'), sequence)
    WHERE event_type = 'thread.activity-appended' AND json_extract(metadata_json, '$.requestId') IS NOT NULL
  `;
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_projection_user_input_claims
    ON projection_thread_activities (thread_id, created_at)
    WHERE kind = 'user-input.response-claimed'
  `;
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_projection_user_input_outcomes
    ON projection_thread_activities (thread_id, json_extract(payload_json, '$.requestActivityId'))
    WHERE kind IN ('user-input.resolved', 'provider.user-input.respond.failed')
      AND json_extract(payload_json, '$.requestActivityId') IS NOT NULL
  `;
});
