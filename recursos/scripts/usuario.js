import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { ref as dbRef, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { app, auth, database, showMessage } from './app.js';

// Inicializar pestañas de login/registro
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthTabs();
    initializeAuthForms();
});

// Inicializar sistema de pestañas
function initializeAuthTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (tabButtons.length > 0 && tabPanes.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Desactivar todas las pestañas
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Activar la pestaña seleccionada
                this.classList.add('active');
                document.getElementById(`${tabId}-form`).classList.add('active');
            });
        });
    }
}

// Inicializar formularios de autenticación
function initializeAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const resetPasswordLink = document.getElementById('resetPassword');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (resetPasswordLink) {
        resetPasswordLink.addEventListener('click', handlePasswordReset);
    }
}

// Manejar inicio de sesión
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showMessage('Por favor, completa todos los campos.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Por favor, introduce un email válido.', 'error');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        showMessage(`Bienvenido de nuevo, ${user.email}`, 'success');
        
        // Redirigir al panel después de un breve delay
        setTimeout(() => {
            window.location.href = 'panel.html';
        }, 1500);
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        handleAuthError(error);
    }
}

// Manejar registro de usuario
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    // Validaciones
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Por favor, completa todos los campos.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Por favor, introduce un email válido.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden.', 'error');
        return;
    }
    
    try {
        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Actualizar perfil con el nombre
        await updateProfile(user, {
            displayName: name
        });
        
        // Crear registro en la base de datos (usando Cloud Function)
        await createUserInDatabase(user.uid, name, email);
        
        showMessage(`Cuenta creada correctamente. Bienvenido, ${name}!`, 'success');
        
        // Redirigir al panel después de un breve delay
        setTimeout(() => {
            window.location.href = 'panel.html';
        }, 1500);
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        handleAuthError(error);
    }
}

// Crear usuario en la base de datos (esta función sería manejada por Cloud Functions en producción)
async function createUserInDatabase(uid, name, email) {
    try {
        const userData = {
            perfil: {
                nombre: name,
                email: email,
                fechaRegistro: new Date().toISOString()
            },
            progreso: {
                contenido: 0,
                tests: 0
            },
            suscripcion: {
                plan: 'gratuito',
                estado: 'inactivo',
                fechaInicio: null,
                fechaFin: null
            }
        };
        
        await set(dbRef(database, `usuarios/${uid}`), userData);
        console.log('Usuario creado en la base de datos');
    } catch (error) {
        console.error('Error al crear usuario en la base de datos:', error);
        throw error;
    }
}

// Manejar restablecimiento de contraseña
async function handlePasswordReset(e) {
    e.preventDefault();
    
    const email = prompt('Por favor, introduce tu dirección de email:');
    
    if (!email) {
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Por favor, introduce un email válido.', 'error');
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage('Se ha enviado un email para restablecer tu contraseña.', 'success');
    } catch (error) {
        console.error('Error al enviar email de restablecimiento:', error);
        handleAuthError(error);
    }
}

// Manejar errores de autenticación
function handleAuthError(error) {
    let message = 'Ha ocurrido un error inesperado. Intenta nuevamente.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'Este email ya está registrado.';
            break;
        case 'auth/invalid-email':
            message = 'El formato del email no es válido.';
            break;
        case 'auth/operation-not-allowed':
            message = 'Esta operación no está permitida.';
            break;
        case 'auth/weak-password':
            message = 'La contraseña es demasiado débil.';
            break;
        case 'auth/user-disabled':
            message = 'Esta cuenta ha sido deshabilitada.';
            break;
        case 'auth/user-not-found':
            message = 'No existe una cuenta con este email.';
            break;
        case 'auth/wrong-password':
            message = 'La contraseña es incorrecta.';
            break;
        default:
            message = error.message;
    }
    
    showMessage(message, 'error');
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}