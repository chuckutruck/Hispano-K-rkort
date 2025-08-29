const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret);

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: data.amount,
            currency: 'sek',
            metadata: { userId: context.auth.uid }
        });
        return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            functions.config().stripe.webhook_secret
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        
        await admin.firestore().collection('users').doc(userId).update({
            'suscripcion.estado': 'activo',
            'suscripcion.fechaInicio': admin.firestore.FieldValue.serverTimestamp(),
            'suscripcion.fechaFin': admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
            )
        });
    }

    res.json({ received: true });
});