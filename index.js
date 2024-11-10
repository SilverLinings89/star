const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 4200;

app.use(express.static('public'));

const loadRiddleStatus = () => {
	const data = fs.readFileSync('riddleStatus.json', 'utf-8');
	return JSON.parse(data);
};

const saveRiddleStatus = (status) => {
	fs.writeFileSync('riddleStatus.json', JSON.stringify(status), 'utf-8');
};

const unlockDailyRiddles = () => {
	const today = new Date();
	const day = today.getDate();
	const status = loadRiddleStatus();
	if (today.getMonth() === 11 && day <= 24) {
		for (let i = 1; i <= day; i++) {
			const day = i.toString();
			if (status[day].status === "locked") {
				status[day].status = "available";
			}
		}
		saveRiddleStatus(status);
	}
	return status;
};

app.get('/api/riddle-status', (_, res) => {
	const status = unlockDailyRiddles();
	const today = new Date().getDate();

	const filteredStatus = Object.keys(status).reduce((result, day) => {
		if (parseInt(day) <= today && status[day].status === "available") {
			result[day] = { status: "available", url: status[day].url };
		} else {
			result[day] = { status: status[day].status };
		}
		return result;
	}, {});

	res.json(filteredStatus);
});

app.post('/api/update-riddle/:day/:status', (req, res) => {
	const day = req.params.day;
	const newStatus = req.params.status;

	const status = loadRiddleStatus();
	if (status[day]) {
		status[day].status = newStatus;
		saveRiddleStatus(status);
		res.json({ message: 'Status updated', status });
	} else {
		res.status(404).json({ message: 'Riddle not found' });
	}
});

app.get('/riddle/:dayId', (req, res) => {
	const [day, uniqueId] = req.params.dayId.split('-');
	const status = loadRiddleStatus();

	if (status[day] && status[day].status === "available" && status[day].url.endsWith(uniqueId)) {
		res.sendFile(__dirname + `/public/riddles/riddle${day}.html`);
	} else {
		res.redirect('/');
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

