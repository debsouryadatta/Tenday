# Free-only AI configuration

Owner policy, 8 November 2026: free inference only. Do not purchase credits, enable paid fallback or add billable OCR/PDF plugins.

The live [OpenRouter model catalog](https://openrouter.ai/api/v1/models) was checked on 8 November 2026. Initial candidate: `dots-studio/dots-3-note-preview:free`, served by AtlasCloud, with text/image input and structured output support. A synthetic JSON smoke request succeeded with cost 0 and `provider.data_collection: "deny"`. Task checks succeeded for text meals, a real food photo, contextual conversation and synthetic PDF/image reports; estimates still require user review. The endpoint is currently marked for retirement on 31 December 2026, so keep the model configurable and recheck availability before that date. This is a suitable current candidate, not a claim that popularity proves it is universally best.

Do not use NVIDIA free trial endpoints for private reports, voices or personal context: their [free endpoint terms](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free) explicitly prohibit confidential/personal input. The Gemma 4 31B free endpoint was also checked with synthetic text but returned upstream rate limiting.

Server configuration uses `OPENROUTER_TEXT_MODEL` and `OPENROUTER_VISION_MODEL`. Both default to the validated free candidate. Keep `OPENROUTER_API_KEY` only in Convex. Requests restrict prompt/completion prices to zero, disable collection-based routing, reject non-free IDs and avoid paid plugins. Never fall back to an arbitrary paid model. Free capacity changes; preserve drafts and provide manual input/retry when unavailable.

OpenRouter documents account-wide free request limits; inspect the authorised key's current remaining requests without exposing its value. Cache guidance and bound retries. See [rate limits](https://openrouter.ai/docs/api/reference/limits).

Voice uses device/browser speech recognition instead of sending voices to NVIDIA's free endpoint. The minimal emulator has no speech service; Tenday reports that state and offers text/gallery input. It reports unsupported/offline recognition rather than inserting example transcripts.

Report PDFs use server-side pdf-lib validation and unpdf text extraction, bounded to three pages and 6 MB. No paid OCR/plugin is requested. Scanned PDFs need clear page images or manual entry. Retain exact values and units for review. No AI output becomes a confirmed record until the user saves it.
