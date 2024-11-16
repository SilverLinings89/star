const express = require('express');
const fs = require('fs');
const app = express();
const cron = require('node-cron');

// Valid states for a riddle: locked, available, done

const { Gpio } = require("rpi-ws281x-native");
const PORT = 4200;

const NUM_LEDS = 144;
const LED_PIN = 18;
const leds = new Uint32Array(NUM_LEDS);
const LEDS_PER_FIELD = 6;


const ws281x = require("rpi-ws281x-native");
ws281x.init({ count: NUM_LEDS, gpio: LED_PIN });

const STATUS_COLORS = {
	locked: 0xff0000,
	available: 0xffa500,
	solved: 0x00ff00
};

function updateLeds() {
	const status = loadRiddleStatus();

	leds.fill(0);

	Object.entries(status).forEach(([day, { status }], index) => {
		const startIdx = index * LEDS_PER_FIELD;
		const color = STATUS_COLORS[status] || 0x000000;
		for (let i = startIdx; i < startIdx + LEDS_PER_FIELD; i++) {
			leds[i] = color;
		}
	});

	ws281x.render(leds);
}

app.use(express.static('public'));

const loadRiddleStatus = () => {
	const data = fs.readFileSync('riddleStatus.json', 'utf-8');
	return JSON.parse(data);
};

const loadRiddles = () => {
	const data = fs.readFileSync('riddles.json', 'utf-8');
	return JSON.parse(data);
};

const saveRiddleStatus = (status) => {
	updateLeds();
	fs.writeFileSync('riddleStatus.json', JSON.stringify(status), 'utf-8');
};

const solve_riddle = (day) => {
	const status = loadRiddleStatus();
	if (status[day].status === "available") {
		status[day].status = "done";
	}
	saveRiddleStatus(status);
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

app.post('/api/solution', (req, res) => {
	const body = req.body;
	const id = body.id;
	const solution = body.solution;
	const riddles = loadRiddles();
	let success = false;
	for (let r in riddles) {
		if (r.id == id && r.solution == solution) {
			success = true;
			solve_riddle(r.day);
		}
	}
	res.json({ success });
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

cron.schedule('* * * * * *', () => {
	updateLeds();
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

