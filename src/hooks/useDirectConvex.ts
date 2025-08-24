/**
 * Direct Convex API calls that bypass the generated API
 * This is a temporary workaround while the CLI deployment is broken
 */

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "http://localhost:3210";

export async function directQuery(functionPath: string, args: any = {}) {
  try {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: functionPath,
        args,
      }),
    });

    const result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage || "Query failed");
    }

    return result.value || result;
  } catch (error) {
    console.error(`Direct query ${functionPath} failed:`, error);
    throw error;
  }
}

export async function directMutation(functionPath: string, args: any = {}) {
  try {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: functionPath,
        args,
      }),
    });

    const result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage || "Mutation failed");
    }

    return result.value || result;
  } catch (error) {
    console.error(`Direct mutation ${functionPath} failed:`, error);
    throw error;
  }
}

// Specific functions for our deployed backend
export async function getDeployedMessages() {
  return directQuery("chat:getMessages");
}

export async function sendToDeployedBackend(body: string, user: string) {
  return directMutation("chat:sendMessage", { body, user });
}
