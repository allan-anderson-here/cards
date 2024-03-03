import React from "https://esm.sh/react";

export default function ({bodyContent}: {bodyContent: string}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="./main.css">
      <title>Capture TOOD</title>
    </head>
    <body>
			${bodyContent}
    </body>
    </html>
	`;
}
