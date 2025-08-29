const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.actualizarSuscripcion = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    
    const { plan, estado, fechaInicio, fechaFin } = data;
    
    try {
        await admin.database().ref(`usuarios/${context.auth.uid}/suscripcion`).set({
            plan,
            estado,
            fechaInicio,
            fechaFin,
            ultimaActualizacion: admin.database.ServerValue.TIMESTAMP
        });
        
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.verificarSuscripcion = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    
    try {
        const snapshot = await admin.database().ref(`usuarios/${context.auth.uid}/suscripcion`).once('value');
        const suscripcion = snapshot.val();
        
        if (!suscripcion || suscripcion.estado !== 'activo') {
            return { activa: false };
        }
        
        // Verificar si la suscripción no ha expirado
        const ahora = Date.now();
        const fechaFin = new Date(suscripcion.fechaFin).getTime();
        
        return { 
            activa: fechaFin > ahora,
            plan: suscripcion.plan,
            fechaFin: suscripcion.fechaFin
        };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Tarea programada para verificar suscripciones expiradas
exports.verificarSuscripcionesExpiradas = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    try {
        const usuariosRef = admin.database().ref('usuarios');
        const snapshot = await usuariosRef.once('value');
        
        if (!snapshot.exists()) return null;
        
        const ahora = Date.now();
        const updates = {};
        
        snapshot.forEach((childSnapshot) => {
            const usuario = childSnapshot.val();
            if (usuario.suscripcion && usuario.suscripcion.estado === 'activo') {
                const fechaFin = new Date(usuario.suscripcion.fechaFin).getTime();
                if (fechaFin <= ahora) {
                    updates[`${childSnapshot.key}/suscripcion/estado`] = 'expirada';
                }
            }
        });
        
        await usuariosRef.update(updates);
        console.log(`Suscripciones actualizadas: ${Object.keys(updates).length}`);
        return null;
    } catch (error) {
        console.error('Error verificando suscripciones:', error);
        return null;
    }
});