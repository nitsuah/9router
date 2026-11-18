import { describe, it, expect } from "vitest";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";
import { getThinkingLevels } from "../../open-sse/providers/thinkingLevels.js";
import { applyThinking } from "../../open-sse/translator/concerns/thinkingUnified.js";

describe("cloudflare-ai Workers AI reasoning_effort enums", () => {
  it("advertises Cloudflare's documented Qwen 3.8 levels (not the generic *qwen* set)", () => {
    expect(getThinkingLevels("cloudflare-ai", "@cf/qwen/qwen3.8-27b")).toEqual([
      "low",
      "medium",
      "xhigh",
    ]);
    expect(getCapabilitiesForModel("cloudflare-ai", "@cf/qwen/qwen3.8-27b")).toMatchObject({
      reasoning: true,
      thinkingFormat: "openai",
      thinkingCanDisable: false,
      vision: true,
    });
  });

  it("advertises Cloudflare's documented GLM-5.3 levels (low|high|max)", () => {
    expect(getThinkingLevels("cloudflare-ai", "@cf/zai-org/glm-5.3")).toEqual([
      "low",
      "high",
      "max",
    ]);
    expect(getCapabilitiesForModel("cloudflare-ai", "@cf/zai-org/glm-5.3")).toMatchObject({
      reasoning: true,
      thinkingFormat: "openai",
      thinkingCanDisable: false,
    });
  });

  it("omits reasoning_effort:auto for Cloudflare GLM-5.3 (not in the CF enum)", () => {
    const enabled = { thinking: { type: "enabled" } };
    applyThinking("openai", "@cf/zai-org/glm-5.3", enabled, "cloudflare-ai");
    expect(enabled.reasoning_effort).toBeUndefined();

    const auto = { reasoning_effort: "auto" };
    applyThinking("openai", "@cf/zai-org/glm-5.3", auto, "cloudflare-ai");
    expect(auto.reasoning_effort).toBeUndefined();
  });

  it("keeps an explicit positive budget_tokens path for Cloudflare GLM-5.3", () => {
    const body = { thinking: { type: "enabled", budget_tokens: 8000 } };
    applyThinking("openai", "@cf/zai-org/glm-5.3", body, "cloudflare-ai");
    expect(body.reasoning_effort).toBe("medium");
  });

  it("still forwards documented levels for Cloudflare Qwen 3.8", () => {
    const body = { reasoning_effort: "xhigh" };
    applyThinking("openai", "@cf/qwen/qwen3.8-27b", body, "cloudflare-ai");
    expect(body.reasoning_effort).toBe("xhigh");
  });
});
