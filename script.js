(function () {

    // --- DATA ---

    const animals = [
        { name: 'cat', icon: 'cat' },
        { name: 'dog', icon: 'dog' },
        { name: 'fish', icon: 'fish' },
        { name: 'bird', icon: 'bird' },
        { name: 'horse', icon: 'horse' },
        { name: 'ladybug', icon: 'ladybug' },
        { name: 'pig', icon: 'pig' },
        { name: 'rabbit', icon: 'rabbit' },
        { name: 'turtle', icon: 'tortoise' },
        { name: 'elephant', icon: 'elephant' },
        { name: 'owl', icon: 'owl' },
        { name: 'snake', icon: 'snake' },
    ];

    const iconUrl = icon => `icons/${icon}.svg`;

    // --- ELEMENT REFERENCES ---
    const leftEl = document.getElementById('left');
    const rightEl = document.getElementById('right');
    const leftImg = document.getElementById('leftImg');
    const rightImg = document.getElementById('rightImg');
    const leftLabel = document.getElementById('leftLabel');
    const rightLabel = document.getElementById('rightLabel');
    const sentenceEl = document.getElementById('sentence');
    const newBtn = document.getElementById('newBtn');
    const speakBtn = document.getElementById('speakBtn');
    const scoreEl = document.getElementById('score');

    // --- STATE VARIABLES ---
    let leftAnimal, rightAnimal, correctFirst;
    let synth = window.speechSynthesis;
    let clickedFirst = false;
    let roundTimer = null;
    let correctCount = 0;
    let incorrectCount = 0;

    // --- HELPERS ---

    function pickTwo() {
        const a = animals[Math.floor(Math.random() * animals.length)];
        let b = animals[Math.floor(Math.random() * animals.length)];
        while (b.name === a.name) {
            b = animals[Math.floor(Math.random() * animals.length)];
        }
        return [a, b];
    }

    function makeSentence(aName, bName) {
        const templates = [
            { t: `Before you touch the ${aName}, touch the ${bName}.`, order: 'second-first' },
            { t: `Touch the ${aName} before you touch the ${bName}.`, order: 'first-first' },
            { t: `Touch the ${bName} after you've touched the ${aName}.`, order: 'second-first' },
            { t: `After touching the ${aName}, touch the ${bName}.`, order: 'first-first' },
            // { t: `Touch the ${bName} only after you've touched the ${aName}.`, order: 'first-first' },
            // { t: `Give the ${aName} a pat before you touch the ${bName}.`, order: 'first-first' },
            // { t: `Don't touch the ${bName} until you touch the ${aName}.`, order: 'first-first' },
            // { t: `Touch the ${bName} first, then the ${aName}.`, order: 'second-first' },
            // { t: `Start with the ${aName}, finish with the ${bName}.`, order: 'first-first' },
            // { t: `Before saying hello to the ${bName}, touch the ${aName}.`, order: 'first-first' },
            // { t: `Make sure to touch the ${bName} before the ${aName}.`, order: 'second-first' },
            // { t: `Touch the ${aName}, and after that, touch the ${bName}.`, order: 'first-first' },
            // { t: `Don't forget—the ${aName} comes before the ${bName}.`, order: 'first-first' },
            // { t: `The ${bName} waits! Touch the ${aName} first.`, order: 'first-first' },
            // { t: `Touch the ${bName} only after the ${aName}.`, order: 'first-first' },
            // { t: `First the ${aName}, then the ${bName}.`, order: 'first-first' },
            // { t: `Touch the ${bName} before the ${aName}.`, order: 'second-first' },
        ];

        const pick = templates[Math.floor(Math.random() * templates.length)];
        const firstShouldBe = pick.order === 'second-first' ? 'second' : 'first';

        return { text: pick.t, firstShouldBe };
    }

    function renderAnimals() {
        leftImg.src = iconUrl(leftAnimal.icon);
        rightImg.src = iconUrl(rightAnimal.icon);
        leftLabel.textContent = leftAnimal.name;
        rightLabel.textContent = rightAnimal.name;
    }

    function animateSentence(text) {
        sentenceEl.classList.remove('show');
        void sentenceEl.offsetWidth;
        sentenceEl.textContent = text;
        sentenceEl.classList.add('show');
    }

    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        synth.speak(utterance);
    }

    function playCheer() {
        const audio = new Audio('sounds/cheer.mp3');
        audio.volume = 0.8;
        audio.play().catch(() => {
            // fallback to speech if browser blocked autoplay
            const u = new SpeechSynthesisUtterance('Yay!');
            u.rate = 1.2;
            synth.speak(u);
        });
    }    

    function celebrate() {
        confetti({ particleCount: 160, spread: 110, origin: { y: 0.6 } });
        confetti({ particleCount: 100, spread: 160, origin: { y: 0.3 } });
        playCheer();
    }

    function wrongFeedback(el) {
        el.animate(
            [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-8px)' },
                { transform: 'translateY(0)' }
            ],
            { duration: 420, iterations: 1, easing: 'cubic-bezier(.2,.7,.2,1)' }
        );

        const utterance = new SpeechSynthesisUtterance('Oops');
        utterance.rate = 1.1;
        synth.speak(utterance);
    }

    function updateScore() {
        scoreEl.textContent = `✅ ${correctCount} | ❌ ${incorrectCount}`;
    }

    // --- GAME LOGIC ---

    function newRound() {
        clearTimeout(roundTimer);
        clickedFirst = false;

        const [a, b] = pickTwo();
        leftAnimal = a;
        rightAnimal = b;

        renderAnimals();

        const sentenceData = makeSentence(leftAnimal.name, rightAnimal.name);
        correctFirst = sentenceData.firstShouldBe === 'first' ? 'left' : 'right';

        animateSentence(sentenceData.text);
        setTimeout(() => speak(sentenceData.text), 200);
    }

    function handleChoice(side) {
        if (!clickedFirst) {
            // Expecting first correct one
            if (side === correctFirst) {
                clickedFirst = true; // Mark that the first correct animal was touched
            } else {
                incorrectCount++;
                wrongFeedback(side === 'left' ? leftEl : rightEl);
                updateScore();
            }
        } else {
            // Second click - must be the other one
            const secondExpected = correctFirst === 'left' ? 'right' : 'left';

            if (side === correctFirst) {
                // If they accidentally click the first animal again, ignore it
                return;
            }

            if (side === secondExpected) {
                celebrate();
                correctCount++;
                updateScore();
                animateSentence('Correct!');
                clearTimeout(roundTimer);
                roundTimer = setTimeout(() => newRound(), 5000);
            } else {
                incorrectCount++;
                wrongFeedback(side === 'left' ? leftEl : rightEl);
                updateScore();
            }
        }
    }
    

    // --- EVENT LISTENERS ---

    leftEl.addEventListener('click', () => handleChoice('left'));
    rightEl.addEventListener('click', () => handleChoice('right'));

    leftEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleChoice('left');
        }
    });

    rightEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleChoice('right');
        }
    });

    newBtn.addEventListener('click', newRound);
    speakBtn.addEventListener('click', () => speak(sentenceEl.textContent));

    // --- INITIALIZE ---
    updateScore();
    newRound();

})();
