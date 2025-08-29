import { app } from './app.js';
import { getDatabase, ref, onValue, set } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const db = getDatabase(app);
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) window.location.href = '../acceso.html';

    loadQuiz('b1_examen_1');
    setupEventListeners();
});

function loadQuiz(quizId) {
    const quizRef = ref(db, `cuestionarios/${quizId}`);
    
    onValue(quizRef, (snapshot) => {
        if (snapshot.exists()) {
            currentQuiz = snapshot.val();
            currentQuestionIndex = 0;
            userAnswers = [];
            displayQuestion();
            updateProgress();
        } else {
            console.error('Quiz not found');
        }
    });
}

function displayQuestion() {
    const question = currentQuiz.preguntas[currentQuestionIndex];
    const container = document.getElementById('question-container');
    
    container.innerHTML = `
        <div id="question">${question.texto}</div>
        <div id="options-container" class="options-grid">
            ${question.opciones.map((opcion, index) => `
                <div class="option" data-index="${index}">${opcion}</div>
            `).join('')}
        </div>
    `;
    
    // Add event listeners to options
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => selectAnswer(option.dataset.index));
    });
    
    updateNavigation();
}

function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = parseInt(answerIndex);
    
    // Visual feedback
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`.option[data-index="${answerIndex}"]`).classList.add('selected');
}

function updateNavigation() {
    document.getElementById('btnPrevious').disabled = currentQuestionIndex === 0;
    document.getElementById('btnNext').disabled = currentQuestionIndex === currentQuiz.preguntas.length - 1;
}

function updateProgress() {
    const progress = document.getElementById('quiz-progress');
    progress.innerHTML = `
        Pregunta ${currentQuestionIndex + 1} de ${currentQuiz.preguntas.length}
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${((currentQuestionIndex + 1) / currentQuiz.preguntas.length) * 100}%"></div>
        </div>
    `;
}

function setupEventListeners() {
    document.getElementById('btnPrevious').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
            updateProgress();
        }
    });
    
    document.getElementById('btnNext').addEventListener('click', () => {
        if (currentQuestionIndex < currentQuiz.preguntas.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
            updateProgress();
        }
    });
    
    document.getElementById('btnSubmit').addEventListener('click', submitQuiz);
}

async function submitQuiz() {
    const user = JSON.parse(localStorage.getItem('user'));
    const score = calculateScore();
    
    try {
        // Guardar resultados
        await set(ref(db, `resultados/${user.uid}/${Date.now()}`), {
            fecha: new Date().toISOString(),
            puntaje: score,
            total: currentQuiz.preguntas.length,
            respuestas: userAnswers
        });
        
        // Actualizar progreso
        await set(ref(db, `usuarios/${user.uid}/progreso/examenes`), score / currentQuiz.preguntas.length * 100);
        
        alert(`Examen completado. Puntuación: ${score}/${currentQuiz.preguntas.length}`);
        window.location.href = '../panel.html';
    } catch (error) {
        console.error('Error saving results:', error);
        alert('Error al guardar los resultados');
    }
}

function calculateScore() {
    return userAnswers.reduce((score, answer, index) => {
        return score + (answer === currentQuiz.preguntas[index].respuestaCorrecta ? 1 : 0);
    }, 0);
}