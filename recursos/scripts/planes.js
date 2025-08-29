import { app } from './app.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-functions.js';

const db = getDatabase(app);
const functions = getFunctions(app);

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) window.location.href = '../acceso.html';

    // Cargar planes disponibles
    loadSubscriptionPlans();
    
    // Manejar selección de plan
    document.querySelectorAll('.plan-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            selectPlan(card.dataset.plan);
        });
    });
});

async function loadSubscriptionPlans() {
    try {
        const plansRef = ref(db, 'planes');
        const snapshot = await get(plansRef);
        
        if (snapshot.exists()) {
            const plans = snapshot.val();
            renderPlans(plans);
        } else {
            // Planes por defecto
            const defaultPlans = {
                basico: {
                    nombre: 'Básico',
                    precio: 99,
                    caracteristicas: ['Acceso a teoría', 'Tests básicos', 'Soporte por email']
                },
                premium: {
                    nombre: 'Premium',
                    precio: 199,
                    caracteristicas: ['Todo en Básico', 'Tests ilimitados', 'Simulacros de examen', 'Soporte prioritario']
                }
            };
            renderPlans(defaultPlans);
        }
    } catch (error) {
        console.error('Error loading plans:', error);
    }
}

function renderPlans(plans) {
    const container = document.getElementById('plans-container');
    container.innerHTML = '';
    
    Object.entries(plans).forEach(([id, plan]) => {
        const planCard = `
            <div class="plan-card" data-plan="${id}">
                <h3>${plan.nombre}</h3>
                <div class="plan-price">${plan.precio} SEK/mes</div>
                <ul class="plan-features">
                    ${plan.caracteristicas.map(feat => `<li>${feat}</li>`).join('')}
                </ul>
                <button class="btn-primary">Seleccionar</button>
            </div>
        `;
        container.innerHTML += planCard;
    });
}

async function selectPlan(planId) {
    try {
        const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
        const result = await createPaymentIntent({ plan: planId, amount: 19900 }); // 199 SEK en öre
        
        // Redirigir a confirmación con Stripe
        window.location.href = `confirmar.html?payment_intent=${result.data.clientSecret}`;
    } catch (error) {
        console.error('Error selecting plan:', error);
        alert('Error al procesar la suscripción: ' + error.message);
    }
}