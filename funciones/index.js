const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret);
const cors = require('cors')({origin: true});

admin.initializeApp();

// Importar módulos de funciones
const pagos = require('./pagos');
const vales = require('./vales');
const miembros = require('./miembros');
const examenes = require('./examenes');

// Exportar funciones
exports.crearSesionPago = pagos.crearSesionPago;
exports.webhookStripe = pagos.webhookStripe;
exports.crearVale = vales.crearVale;
exports.canjearVale = vales.canjearVale;
exports.actualizarSuscripcion = miembros.actualizarSuscripcion;
exports.registrarResultadoExamen = examenes.registrarResultadoExamen;
exports.obtenerEstadisticas = examenes.obtenerEstadisticas;

// Función de ejemplo para crear usuario en la base de datos
exports.crearUsuario = functions.auth.user().onCreate(async (user) => {
    try {
        const userData = {
            perfil: {
                nombre: user.displayName || user.email.split('@')[0],
                email: user.email,
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

        await admin.database().ref(`usuarios/${user.uid}`).set(userData);
        console.log(`Usuario ${user.uid} creado correctamente en la base de datos.`);
    } catch (error) {
        console.error('Error al crear usuario en la base de datos:', error);
    }
});

// Función para eliminar usuario de la base de datos cuando se elimina la cuenta
exports.eliminarUsuario = functions.auth.user().onDelete(async (user) => {
    try {
        await admin.database().ref(`usuarios/${user.uid}`).remove();
        console.log(`Usuario ${user.uid} eliminado correctamente de la base de datos.`);
    } catch (error) {
        console.error('Error al eliminar usuario de la base de datos:', error);
    }
});