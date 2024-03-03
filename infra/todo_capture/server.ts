// Importing necessary modules from Deno standard libraries
import { serve, ServerRequest, ServerResponse } from "https://deno.land/std/http/server.ts";
import { layout } from "./views/Layout.ts";
import { TodoCaptureForm } from "./views/TodoCaptureForm.ts";
import {
  encodeBase64,
  decodeBase64,
} from "https://deno.land/std/encoding/base64.ts";

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

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const fileData = await response.json();

  // Decode the Base64 content from GitHub into a UTF-8 string
  const currentContentDecodedBytes = decodeBase64(fileData.content);
  const currentContent = new TextDecoder().decode(currentContentDecodedBytes);

  // Append new content to the existing content
  const updatedContent = currentContent + "\n\n" + contentToAppend;

  // Encode the updated content from a string to a UTF-8 byte array, then to Base64
  const updatedContentEncoded = encodeBase64(
    new TextEncoder().encode(updatedContent)
  );

  // Update the file on GitHub
  const updateResponse = await fetch(API_URL, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Add TODO via Deno Deploy",
      content: updatedContentEncoded,
      sha: fileData.sha,
    }),
  });

  if (!updateResponse.ok) {
    throw new Error(
      `GitHub API responded with status ${updateResponse.status}: ${updateResponse.statusText}`
    );
  }

  return await updateResponse.json();
}

function flash(message: string): string {
  return `<div class='FlashMessage'>${message}</div>`
}
// Function to serve the HTML form
function serveHtml(html: string): ServerResponse {
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

serve(
  async (req: ServerRequest): Promise<ServerResponse> => {
    if (req.method === "GET") {
      // Serve the HTML form for GET requests
      return serveHtml(layout(TodoCaptureForm));
    } else if (req.method === "POST") {
      // Process form submissions for POST requests
      try {
        const body = await req.text();
        const formData = parseFormData(body);
        const contentToAppend = formData["content"];
        if (!contentToAppend) {
          return new Response("No content provided", { status: 400 });
        }
        await appendToGitHubFile(contentToAppend);
        return serveHtml(flash('Success') + layout(TodoCaptureForm));
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