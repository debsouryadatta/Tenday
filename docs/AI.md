# Free-only AI configuration

Owner policy, 8 November 2026: free inference only. Do not purchase credits, enable paid fallback or add billable OCR/PDF plugins.

The live [OpenRouter model catalog](https://openrouter.ai/api/v1/models) was checked on 8 November 2026. Initial candidate: `dots-studio/dots-3-note-preview:free`, served by AtlasCloud, with text/image input and structured output support. A synthetic JSON smoke request succeeded with cost 0 and `provider.data_collection: "deny"`. Quality still requires task-specific verification. The endpoint is currently marked for retirement on 31 December 2026, so keep the model configurable and recheck availability before that date. This is a suitable current candidate, not a claim that popularity proves it is universally best.

Do not use NVIDIA free trial endpoints for private reports, voices or personal context: their [free endpoint terms](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free) explicitly prohibit confidential/personal input. The Gemma 4 31B free endpoint was also checked with synthetic text but returned upstream rate limiting.

Server configuration will use `OPENROUTER_TEXT_MODEL` and `OPENROUTER_VISION_MODEL`. Both default to the validated free candidate. Keep `OPENROUTER_API_KEY` only in Convex. Requests must restrict prompt/completion prices to zero, disable collection-based routing, reject non-free IDs and avoid paid plugins. Never fall back to an arbitrary paid model. Free capacity changes; preserve drafts and provide manual input/retry when unavailable.

OpenRouter documents account-wide free request limits; inspect the authorised key's current remaining requests without exposing its value. Cache guidance and bound retries. See [rate limits](https://openrouter.ai/docs/api/reference/limits).

Voice should use device/browser speech recognition instead of sending voices to NVIDIA's free endpoint. Confirm actual device support and permission behavior. Clearly report unsupported/offline recognition rather than inserting example transcripts.

Report PDFs must use a bounded local parser/rasterizer or OpenRouter's explicitly free `pdf-text` processing, verified against current documentation; never allow the billable default OCR engine. Retain exact values and units for review. No AI output becomes a confirmed record until the user saves it.
