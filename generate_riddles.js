const fs = require('fs');
const path = require('path');

const inputFilePath = './riddles.json';
const outputDir = './public';

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

fs.readFile(inputFilePath, 'utf-8', (err, data) => {
	if (err) {
		console.error('Error reading JSON file:', err);
		return;
	}

	let jsonObjects;
	try {
		jsonObjects = JSON.parse(data);
	} catch (parseErr) {
		console.error('Error parsing JSON:', parseErr);
		return;
	}

	jsonObjects.forEach((obj) => {
		const { id, type, description } = obj;

		if (!id || !type) {
			console.warn(`Skipping object with missing id or type:`, obj);
			return;
		}

		const templatePath = path.join(outputDir, `${type}.html`);

		if (!fs.existsSync(templatePath)) {
			console.warn(`Template file not found for type: ${type}. Skipping object:`, obj);
			return;
		}

		fs.readFile(templatePath, 'utf-8', (templateErr, templateContent) => {
			if (templateErr) {
				console.error(`Error reading template file for type: ${type}`, templateErr);
				return;
			}

			const outputFilePath = path.join(outputDir, `riddle-${id}.html`);
			var target_content = templateContent;
			target_content.replace("{{QUESTION}}", description);
			fs.writeFile(outputFilePath, templateContent, (writeErr) => {
				if (writeErr) {
					console.error(`Error writing file ${outputFilePath}:`, writeErr);
				} else {
					console.log(`File created: ${outputFilePath}`);
				}
			});
		});
	});
});

