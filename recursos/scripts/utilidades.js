// Funciones utilitarias generales
export function mostrarAlerta(mensaje, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alerta alerta-${tipo}`;
    alerta.textContent = mensaje;
    document.body.prepend(alerta);
    
    setTimeout(() => alerta.remove(), 5000);
}

export function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}

export function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Funciones para acordeones FAQ
export function inicializarAcordeones() {
    document.querySelectorAll('.pregunta').forEach(pregunta => {
        pregunta.addEventListener('click', () => {
            pregunta.classList.toggle('activa');
        });
    });
}

// Manejo de estados de carga
export function mostrarCargador() {
    document.getElementById('cargador').style.display = 'block';
}

export function ocultarCargador() {
    document.getElementById('cargador').style.display = 'none';
}