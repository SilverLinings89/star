async function send_solve(solution) {
    const userAnswer = solution.trim();
    const riddleId = window.location.pathname.split('-')[1].split('.')[0];
    if (!userAnswer) {
        feedbackEl.textContent = 'Please enter an answer.';
        feedbackEl.style.color = 'red';
        return;
    }

    const payload = {
        id: riddleId,
        solution: userAnswer
    };

    try {
        const response = await fetch('/api/solution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}
