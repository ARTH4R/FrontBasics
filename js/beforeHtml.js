
const questions = document.querySelectorAll('.question-container');
const progressFill = document.getElementById('progressFill');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const resultContainer = document.getElementById('resultContainer');
const scoreDisplay = document.getElementById('scoreDisplay');
const saveBtn = document.getElementById('saveBtn');
const modalOverlay = document.getElementById('modalOverlay');
const nameInput = document.getElementById('nameInput');
const confirmBtn = document.getElementById('confirmBtn');
const successMessage = document.getElementById('successMessage');

let currentQuestion = 0;
let userAnswers = Array(20).fill(null);
const correctAnswers = [1, 2, 3, 0, 1, 2, 1, 2, 3, 0, 1, 2, 3, 1, 0, 3, 1, 2, 0, 1];
let totalScore = 0;
let isSaved = false;

// TODO: ใส่ URL ของ Google Apps Script Web App ที่นี่
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

function updateProgress() {
    const percent = ((currentQuestion + 1) / 20) * 100;
    progressFill.style.width = percent + '%';
}

function showQuestion(index) {
    questions.forEach(q => q.classList.remove('active'));
    questions[index].classList.add('active');
    updateProgress();
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === 19 ? 'ส่งคำตอบ' : 'ถัดไป';
}

document.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', () => {
        const questionIndex = parseInt(option.closest('.question-container').dataset.question);
        const selectedAnswer = parseInt(option.dataset.answer);
        userAnswers[questionIndex] = selectedAnswer;

        option.closest('.options').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
    });
});

nextBtn.addEventListener('click', () => {
    if (currentQuestion < 19) {
        currentQuestion++;
        showQuestion(currentQuestion);
    } else {
        submitQuiz();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
    }
});

function submitQuiz() {
    totalScore = 0;
    for (let i = 0; i < 20; i++) {
        if (userAnswers[i] === correctAnswers[i]) totalScore++;
    }

    const percentage = ((totalScore / 20) * 100).toFixed(0);
    document.querySelector('.quiz-content').style.display = 'none';
    resultContainer.classList.add('active');
    scoreDisplay.textContent = `${totalScore}/20 (${percentage}%)`;
    isSaved = false;
    successMessage.classList.remove('active');
}

function restartQuiz() {
    userAnswers.fill(null);
    totalScore = 0;
    currentQuestion = 0;
    isSaved = false;
    document.querySelector('.quiz-content').style.display = 'block';
    resultContainer.classList.remove('active');
    successMessage.classList.remove('active');
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    showQuestion(currentQuestion);
    updateProgress();
}

// Open Modal
saveBtn.addEventListener('click', () => {
    if (isSaved) {
        alert('คุณได้บันทึกคะแนนนี้แล้ว');
        return;
    }
    modalOverlay.classList.add('active');
    nameInput.value = '';
    nameInput.focus();
});

// Close Modal
function closeModal() {
    modalOverlay.classList.remove('active');
}

// Enable/Disable Confirm Button
nameInput.addEventListener('input', () => {
    confirmBtn.disabled = nameInput.value.trim() === '';
});

// Save to Google Sheet
async function saveToGoogleSheet() {
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('กรุณาระบุชื่อของคุณ');
        return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'กำลังบันทึก...';

    const data = {
        name: name,
        score: totalScore,
        total: 20,
        percentage: ((totalScore / 20) * 100).toFixed(0),
        timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        answers: userAnswers.join(',')
    };

    try {
        // ส่งข้อมูลไปยัง Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        // เนื่องจากใช้ no-cors จึงถือว่าสำเร็จ
        closeModal();
        isSaved = true;
        saveBtn.disabled = true;
        successMessage.classList.add('active');
        
    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'ยืนยัน';
    }
}

// Close modal when clicking outside
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Enter key to submit in modal
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && nameInput.value.trim() !== '') {
        saveToGoogleSheet();
    }
});

// Initialize
showQuestion(currentQuestion);