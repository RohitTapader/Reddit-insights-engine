export function getSegmentationStrategy(category: string) {
    switch (category) {
      case "electronics":
        return ["heavy_usage", "casual_usage", "performance", "budget"];
      case "baby_care":
        return ["price_sensitive", "skin_sensitive", "absorbency", "brand_trust"];
      case "fashion":
        return ["style", "comfort", "budget"];
      case "appliances":
        return ["durability", "energy_efficiency", "low_maintenance"];
      default:
        return ["general"];
    }
  }