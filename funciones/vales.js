const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.generarVale = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    
    const { monto, validez } = data;
    const codigo = generateVoucherCode();
    
    try {
        // Guardar vale en Realtime Database
        await admin.database().ref(`vales/${codigo}`).set({
            monto,
            validez,
            generadoPor: context.auth.uid,
            usado: false,
            fechaGeneracion: admin.database.ServerValue.TIMESTAMP
        });
        
        return { codigo, monto, validez };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.canjearVale = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    
    const { codigo } = data;
    
    try {
        const valeRef = admin.database().ref(`vales/${codigo}`);
        const snapshot = await valeRef.once('value');
        
        if (!snapshot.exists()) {
            throw new functions.https.HttpsError('not-found', 'Vale no encontrado');
        }
        
        const vale = snapshot.val();
        
        if (vale.usado) {
            throw new functions.https.HttpsError('failed-precondition', 'Vale ya utilizado');
        }
        
        if (vale.validez < Date.now()) {
            throw new functions.https.HttpsError('failed-precondition', 'Vale expirado');
        }
        
        // Marcar como usado y registrar quién lo canjeó
        await valeRef.update({
            usado: true,
            canjeadoPor: context.auth.uid,
            fechaCanje: admin.database.ServerValue.TIMESTAMP
        });
        
        // Añadir crédito al usuario
        await admin.database().ref(`usuarios/${context.auth.uid}/creditos`).transaction(
            (current) => (current || 0) + vale.monto
        );
        
        return { monto: vale.monto };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

function generateVoucherCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}