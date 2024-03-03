export default function (bodyContent: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
      body {
        background: lightblue;
      }
      </style>
      <title>Capture TOOD</title>
    </head>
    <body>
			${bodyContent}
    </body>
    </html>
	`;
}
