export function getMaxTokens(intent: string) {
    switch (intent) {
      case "insights":
        return 120;
  
      case "sentiment":
        return 100;
  
      case "competitors":
        return 150;
  
      case "ask":
        return 100;
  
      default:
        return 120;
    }
  }