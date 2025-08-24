import { describe, expect, it } from "vitest";

import { cn } from "../utils";

describe("utils", () => {
  describe("cn (className helper)", () => {
    it("merges class names correctly", () => {
      expect(cn("text-red-500", "bg-blue-500")).toBe(
        "text-red-500 bg-blue-500"
      );
    });

    it("handles conditional classes", () => {
      const showConditional = true;
      const showHidden = false;
      expect(
        cn("base", showConditional && "conditional", showHidden && "hidden")
      ).toBe("base conditional");
    });

    it("handles undefined and null values", () => {
      expect(cn("base", undefined, null, "end")).toBe("base end");
    });

    it("handles Tailwind conflicts correctly", () => {
      // This should resolve conflicts with tailwind-merge
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("returns empty string for no classes", () => {
      expect(cn()).toBe("");
      expect(cn(false, null, undefined)).toBe("");
    });

    it("handles arrays of classes", () => {
      expect(cn(["text-red-500", "bg-blue-500"])).toBe(
        "text-red-500 bg-blue-500"
      );
    });

    it("handles objects with boolean conditions", () => {
      expect(
        cn({
          "text-red-500": true,
          "bg-blue-500": false,
          "font-bold": true,
        })
      ).toBe("text-red-500 font-bold");
    });

    it("handles complex combinations", () => {
      const result = cn(
        "base-class",
        ["array-class-1", "array-class-2"],
        {
          "conditional-true": true,
          "conditional-false": false,
        },
        (() => true)() && "inline-conditional",
        "final-class"
      );

      expect(result).toContain("base-class");
      expect(result).toContain("array-class-1");
      expect(result).toContain("array-class-2");
      expect(result).toContain("conditional-true");
      expect(result).toContain("inline-conditional");
      expect(result).toContain("final-class");
      expect(result).not.toContain("conditional-false");
    });
  });
});
