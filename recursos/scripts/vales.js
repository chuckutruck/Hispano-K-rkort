import { app } from './app.js';
import { getDatabase, ref, set, push } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-functions.js';

const db = getDatabase(app);
const functions = getFunctions(app);

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) window.location.href = '../acceso.html';
    
    // Configurar event listeners según la página
    if (document.getElementById('generateVoucher')) {
        setupVoucherGeneration();
    }
    
    if (document.getElementById('redeemVoucher')) {
        setupVoucherRedemption();
    }
});

function setupVoucherGeneration() {
    const form = document.getElementById('voucherForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = document.getElementById('amount').value;
        const validity = document.getElementById('validity').value;
        
        try {
            const generateVoucher = httpsCallable(functions, 'generarVale');
            const result = await generateVoucher({ monto: amount, validez: validity });
            
            document.getElementById('voucherResult').innerHTML = `
                <div class="success-message">
                    <h3>Vale generado exitosamente</h3>
                    <p>Código: <strong>${result.data.codigo}</strong></p>
                    <p>Monto: <strong>${result.data.monto} SEK</strong></p>
                    <p>Válido hasta: <strong>${new Date(result.data.validez).toLocaleDateString()}</strong></p>
                </div>
            `;
            
            form.reset();
        } catch (error) {
            console.error('Error generating voucher:', error);
            alert('Error al generar el vale: ' + error.message);
        }
    });
}

function setupVoucherRedemption() {
    const form = document.getElementById('redeemForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('voucherCode').value;
        
        try {
            const redeemVoucher = httpsCallable(functions, 'canjearVale');
            const result = await redeemVoucher({ codigo: code });
            
            document.getElementById('redeemResult').innerHTML = `
                <div class="success-message">
                    <h3>Vale canjeado exitosamente</h3>
                    <p>Se han añadido <strong>${result.data.monto} SEK</strong> a tu cuenta</p>
                </div>
            `;
            
            form.reset();
            
            // Actualizar saldo en la interfaz
            updateUserBalance();
        } catch (error) {
            console.error('Error redeeming voucher:', error);
            document.getElementById('redeemResult').innerHTML = `
                <div class="error-message">
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    });
}

async function updateUserBalance() {
    const user = JSON.parse(localStorage.getItem('user'));
    const balanceRef = ref(db, `usuarios/${user.uid}/creditos`);
    
    onValue(balanceRef, (snapshot) => {
        const balance = snapshot.val() || 0;
        const balanceElement = document.getElementById('userBalance');
        if (balanceElement) {
            balanceElement.textContent = `${balance} SEK`;
        }
    });
}