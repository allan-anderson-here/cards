export default function() {
	return `
		<form action="/" method="post">
			<label for="content">Content:</label><br>
			<textarea id="content" name="content" rows="4" cols="50"></textarea><br>
			<input type="submit" value="Submit">
		</form>
	`
}