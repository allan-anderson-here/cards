// Importing necessary modules from Deno standard libraries
import { serve } from "https://deno.land/std/http/server.ts";
import { encode, decode } from "https://deno.land/std/encoding/base64.ts";

// Environment variables (set these in Deno Deploy's environment variable settings)
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!;
const REPO_OWNER = Deno.env.get("REPO_OWNER")!;
const REPO_NAME = Deno.env.get("REPO_NAME")!;
const FILE_PATH = Deno.env.get("FILE_PATH")!; // e.g., "path/to/file.md"

// GitHub API URL for updating files
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

// Helper function to parse URL-encoded form data
function parseFormData(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const formData: Record<string, string> = {};
  for (const [key, value] of params) {
    formData[key] = value;
  }
  return formData;
}

// Function to append content to a file in a GitHub repository
async function appendToGitHubFile(contentToAppend: string) {
  // Fetch current file content
  const response = await fetch(API_URL, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });
  const fileData = await response.json();
  const currentContent = decode(fileData.content);
  const updatedContent = currentContent + "\n" + contentToAppend;
  const encodedUpdatedContent = encode(updatedContent);

  // Update the file on GitHub
  const updateResponse = await fetch(API_URL, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Append content via Deno Deploy",
      content: encodedUpdatedContent,
      sha: fileData.sha,
    }),
  });

  if (!updateResponse.ok) {
    throw new Error(
      `GitHub API responded with status ${updateResponse.status}`
    );
  }

  return await updateResponse.json();
}

// Main server handler
serve(
  async (req) => {
    if (req.method === "POST") {
      try {
        const body = await req.text();
        const formData = parseFormData(body);
        // Assuming 'content' is the field name in your form
        const contentToAppend = formData["content"];
        if (!contentToAppend) {
          return new Response("No content provided", { status: 400 });
        }
        await appendToGitHubFile(contentToAppend);
        return new Response("Content appended successfully", { status: 200 });
      } catch (error) {
        console.error(error);
        return new Response("Internal server error", { status: 500 });
      }
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  },
  { addr: ":8080" }
);

console.log("Server running on http://localhost:8080/");
