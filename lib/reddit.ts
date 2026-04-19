export type RedditPost = {
    title: string;
    content: string;
    url: string;
    created: number;
  };
  
  /**
   * TEMP SAFE VERSION
   * Avoids Reddit 403 / HTML issues on Vercel
   */
  export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
    console.log("Mock Reddit fetch for:", query);
  
    return [
      {
        title: "Battery drains too fast",
        content: "My phone lasts only 5 hours with normal usage",
        url: "https://reddit.com/r/sample1",
        created: Date.now() / 1000,
      },
      {
        title: "Overheating problem",
        content: "Phone heats up while charging and gaming",
        url: "https://reddit.com/r/sample2",
        created: Date.now() / 1000,
      },
      {
        title: "Charging is slow",
        content: "Takes more than 2 hours to charge fully",
        url: "https://reddit.com/r/sample3",
        created: Date.now() / 1000,
      },
    ];
  }