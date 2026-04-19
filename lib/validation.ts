export function validatePosts(posts: any[]) {
    return posts.filter((p) => p.title && p.title.length > 10);
  }
  
  export function validateOutput(output: any) {
    return output && Array.isArray(output.problems);
  }