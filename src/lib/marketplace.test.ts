import {
  MAX_LISTING_IMAGE_BYTES,
  formatMarketplaceMileage,
  formatMarketplacePrice,
  slugifyMarketplaceListing,
  validateMarketplaceImage,
} from "./marketplace";

describe("marketplace helpers", () => {
  test("creates stable listing slugs", () => {
    expect(slugifyMarketplaceListing("2021 Toyota C-HR Design")).toBe(
      "2021-toyota-c-hr-design",
    );
  });

  test("formats customer prices and mileage in UK style", () => {
    expect(formatMarketplacePrice(19495)).toContain("19,495");
    expect(formatMarketplaceMileage(28700)).toBe("28,700 miles");
  });

  test("accepts safe listing images and rejects unsafe files", () => {
    const image = new File([new Uint8Array(100)], "car.webp", {
      type: "image/webp",
    });
    const pdf = new File([new Uint8Array(100)], "car.pdf", {
      type: "application/pdf",
    });
    const largeImage = new File(
      [new Uint8Array(MAX_LISTING_IMAGE_BYTES + 1)],
      "large.jpg",
      { type: "image/jpeg" },
    );

    expect(validateMarketplaceImage(image, MAX_LISTING_IMAGE_BYTES)).toBeNull();
    expect(validateMarketplaceImage(pdf, MAX_LISTING_IMAGE_BYTES)).toMatch(
      /JPG, PNG or WebP/i,
    );
    expect(
      validateMarketplaceImage(largeImage, MAX_LISTING_IMAGE_BYTES),
    ).toMatch(/smaller than/i);
  });
});

