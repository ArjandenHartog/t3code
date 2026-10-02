import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as SqlClient from "effect/unstable/sql/SqlClient";

import { runMigrations } from "../Migrations.ts";
import * as NodeSqliteClient from "../NodeSqliteClient.ts";

const layer = it.layer(Layer.mergeAll(NodeSqliteClient.layerMemory()));

layer("041_UserInputRequestLookup", (it) => {
  it.effect("upgrades existing event stores and indexes request lookups", () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* runMigrations({ toMigrationInclusive: 40 });
      yield* sql`INSERT INTO orchestration_events
      (event_id, aggregate_kind, stream_id, stream_version, event_type, occurred_at, actor_kind, payload_json, metadata_json)
      VALUES ('existing-question', 'thread', 'thread-1', 1, 'thread.activity-appended', '2026-01-01T00:00:00Z', 'provider', '{}', '{"requestId":"question-1"}')`;
      yield* runMigrations({ toMigrationInclusive: 41 });
      const rows = yield* sql<{
        readonly event_id: string;
      }>`SELECT event_id FROM orchestration_events`;
      assert.deepEqual(rows, [{ event_id: "existing-question" }]);
      const plan = yield* sql<{ readonly detail: string }>`EXPLAIN QUERY PLAN
      SELECT sequence FROM orchestration_events WHERE stream_id = 'thread-1'
        AND event_type = 'thread.activity-appended' AND json_extract(metadata_json, '$.requestId') = 'question-1'
      ORDER BY sequence`;
      assert.isTrue(
        plan.some((row) => row.detail.includes("idx_orchestration_events_request_lookup")),
      );
    }),
  );
});
