import { describe, expect, it } from "vitest";
import { classifyIpType } from "../ip-type";

describe("classifyIpType", () => {
  it("detects datacenter and cloud networks", () => {
    expect(classifyIpType({ asn: "AS16509", org: "Amazon.com, Inc." })).toBe("datacenter");
    expect(classifyIpType({ org: "Google Cloud" })).toBe("datacenter");
    expect(classifyIpType({ isp: "Hetzner Online GmbH" })).toBe("datacenter");
  });

  it("detects residential broadband providers", () => {
    expect(classifyIpType({ org: "Comcast Cable Communications, LLC" })).toBe("residential");
    expect(classifyIpType({ isp: "Google Fiber Inc." })).toBe("residential");
    expect(classifyIpType({ org: "Deutsche Telekom AG" })).toBe("residential");
  });

  it("detects carrier networks", () => {
    expect(classifyIpType({ org: "China Telecom" })).toBe("carrier");
    expect(classifyIpType({ isp: "Chunghwa Telecom" })).toBe("carrier");
  });

  it("prefers residential matches and falls back to unknown", () => {
    expect(classifyIpType({ org: "Comcast Cable", isp: "Amazon AWS" })).toBe("residential");
    expect(classifyIpType({ asn: "AS64500", org: "Example Network" })).toBe("unknown");
    expect(classifyIpType({})).toBe("unknown");
  });
});
