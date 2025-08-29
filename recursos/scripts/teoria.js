import { app } from './app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) window.location.href = '../acceso.html';

    const progressBars = document.querySelectorAll('.progress-fill');
    
    onValue(ref(db, `usuarios/${user.uid}/progreso`), (snapshot) => {
        const progress = snapshot.val() || {};
        progressBars.forEach(bar => {
            const topic = bar.parentElement.parentElement.getAttribute('data-topic');
            bar.style.width = `${progress[topic] || 0}%`;
        });
    });
});