const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.obtenerResultadosExamen = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    
    const { examenId } = data;
    
    try {
        const snapshot = await admin.database().ref(`resultados/${context.auth.uid}/${examenId}`).once('value');
        
        if (!snapshot.exists()) {
            throw new functions.https.HttpsError('not-found', 'Examen no encontrado');
        }
        
        return snapshot.val();
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.generarEstadisticas = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    
    try {
        const snapshot = await admin.database().ref(`resultados/${context.auth.uid}`).once('value');
        
        if (!snapshot.exists()) {
            return { totalExamenes: 0, promedio: 0, mejorResultado: 0 };
        }
        
        const resultados = snapshot.val();
        let totalPuntaje = 0;
        let totalExamenes = 0;
        let mejorResultado = 0;
        
        Object.values(resultados).forEach(examen => {
            totalPuntaje += examen.puntaje;
            totalExamenes++;
            if (examen.puntaje > mejorResultado) {
                mejorResultado = examen.puntaje;
            }
        });
        
        const promedio = totalExamenes > 0 ? Math.round(totalPuntaje / totalExamenes) : 0;
        
        return {
            totalExamenes,
            promedio,
            mejorResultado
        };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Función para generar un examen personalizado basado en el progreso del usuario
exports.generarExamenPersonalizado = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');
    
    try {
        // Obtener el progreso del usuario
        const progresoSnapshot = await admin.database().ref(`usuarios/${context.auth.uid}/progreso`).once('value');
        const progreso = progresoSnapshot.val() || {};
        
        // Obtener todos los cuestionarios disponibles
        const cuestionariosSnapshot = await admin.database().ref('cuestionarios').once('value');
        
        if (!cuestionariosSnapshot.exists()) {
            throw new functions.https.HttpsError('not-found', 'No hay cuestionarios disponibles');
        }
        
        const cuestionarios = cuestionariosSnapshot.val();
        const examenPersonalizado = {
            preguntas: [],
            titulo: 'Examen Personalizado',
            descripcion: 'Generado basado en tu progreso de aprendizaje'
        };
        
        // Lógica para seleccionar preguntas basadas en áreas de mejora
        // (Implementación simplificada)
        Object.values(cuestionarios).forEach(cuestionario => {
            examenPersonalizado.preguntas = examenPersonalizado.preguntas.concat(
                cuestionario.preguntas.slice(0, 2) // Tomar 2 preguntas de cada cuestionario
            );
        });
        
        // Mezclar preguntas y limitar a 20
        examenPersonalizado.preguntas = shuffleArray(examenPersonalizado.preguntas).slice(0, 20);
        
        return examenPersonalizado;
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}