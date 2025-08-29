// Inicialización de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Configuración de Firebase (debes reemplazar con tu configuración)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "hispano-korkort.firebaseapp.com",
    databaseURL: "https://hispano-korkort-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hispano-korkort",
    storageBucket: "hispano-korkort.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Estado global de la aplicación
let currentUser = null;
let userData = null;

// Verificar estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadUserData(user.uid);
        updateUIForAuthenticatedUser(user);
    } else {
        currentUser = null;
        userData = null;
        updateUIForUnauthenticatedUser();
    }
});

// Cargar datos del usuario desde la base de datos
function loadUserData(uid) {
    const userRef = ref(database, `usuarios/${uid}`);
    
    onValue(userRef, (snapshot) => {
        userData = snapshot.val();
        updateUserUI(userData);
    }, (error) => {
        console.error("Error al cargar datos del usuario:", error);
    });
}

// Actualizar UI para usuario autenticado
function updateUIForAuthenticatedUser(user) {
    // Mostrar nombre de usuario en el panel
    const userNameElements = document.querySelectorAll('#userName');
    userNameElements.forEach(element => {
        element.textContent = user.displayName || user.email;
    });
    
    // Mostrar opciones para usuario logueado
    const authButtons = document.querySelector('.user-actions');
    if (authButtons) {
        authButtons.innerHTML = `
            <div class="user-menu">
                <span id="userName">${user.displayName || user.email}</span>
                <div class="dropdown">
                    <a href="panel.html">Panel</a>
                    <a href="#" id="logoutBtn">Cerrar Sesión</a>
                </div>
            </div>
        `;
        
        // Agregar evento al botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
}

// Actualizar UI para usuario no autenticado
function updateUIForUnauthenticatedUser() {
    const authButtons = document.querySelector('.user-actions');
    if (authButtons) {
        authButtons.innerHTML = `
            <a href="acceso.html" class="btn btn-outline">Iniciar Sesión</a>
            <a href="acceso.html" class="btn btn-primary">Registrarse</a>
        `;
    }
}

// Actualizar UI con datos del usuario
function updateUserUI(userData) {
    if (!userData) return;
    
    // Actualizar progreso en el panel
    const contentProgress = document.getElementById('content-progress');
    const testsProgress = document.getElementById('tests-progress');
    
    if (contentProgress && userData.progreso && userData.progreso.contenido) {
        contentProgress.style.width = `${userData.progreso.contenido}%`;
    }
    
    if (testsProgress && userData.progreso && userData.progreso.tests) {
        testsProgress.style.width = `${userData.progreso.tests}%`;
    }
    
    // Actualizar información de suscripción
    const subscriptionInfo = document.getElementById('subscription-info');
    if (subscriptionInfo && userData.suscripcion) {
        const sub = userData.suscripcion;
        subscriptionInfo.innerHTML = `
            <p><strong>Plan:</strong> ${sub.plan}</p>
            <p><strong>Estado:</strong> ${sub.estado}</p>
            <p><strong>Válido hasta:</strong> ${new Date(sub.fechaFin).toLocaleDateString()}</p>
        `;
    }
    
    // Actualizar resultados recientes
    const recentResults = document.getElementById('recent-results');
    if (recentResults && userData.resultados) {
        const results = Object.values(userData.resultados).slice(-3);
        if (results.length > 0) {
            recentResults.innerHTML = results.map(result => `
                <div class="result-item">
                    <p><strong>${result.nombre}</strong>: ${result.puntaje}%</p>
                    <small>${new Date(result.fecha).toLocaleDateString()}</small>
                </div>
            `).join('');
        } else {
            recentResults.innerHTML = '<p>No hay resultados recientes.</p>';
        }
    }
}

// Manejar cierre de sesión
async function handleLogout(e) {
    e.preventDefault();
    try {
        await auth.signOut();
        window.location.href = 'inicio.html';
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        showMessage('Error al cerrar sesión. Intenta nuevamente.', 'error');
    }
}

// Mostrar mensajes al usuario
function showMessage(message, type = 'info') {
    // Crear elemento de mensaje si no existe
    let messageElement = document.getElementById('message-container');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'message-container';
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.right = '20px';
        messageElement.style.zIndex = '1000';
        document.body.appendChild(messageElement);
    }
    
    // Crear mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.padding = '10px 15px';
    messageDiv.style.borderRadius = '4px';
    messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    
    // Estilos según tipo
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
        messageDiv.style.backgroundColor = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    } else if (type === 'warning') {
        messageDiv.style.backgroundColor = '#fff3cd';
        messageDiv.style.color = '#856404';
        messageDiv.style.border = '1px solid #ffeaa7';
    } else {
        messageDiv.style.backgroundColor = '#d1ecf1';
        messageDiv.style.color = '#0c5460';
        messageDiv.style.border = '1px solid #bee5eb';
    }
    
    // Agregar mensaje al contenedor
    messageElement.appendChild(messageDiv);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Utilidad para formatear fechas
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Utilidad para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Exportar funciones y variables globales
window.app = {
    auth,
    database,
    currentUser,
    userData,
    showMessage,
    formatDate,
    isValidEmail
};