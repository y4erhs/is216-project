// Sends emails through EmailJS's web API. Render's free plan blocks normal email ports, so Nodemailer wouldn't work there.
const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

function isEmailSetUp() {
    return Boolean(
        process.env.EMAILJS_SERVICE_ID &&
        process.env.EMAILJS_TEMPLATE_ID &&
        process.env.EMAILJS_PUBLIC_KEY &&
        process.env.EMAILJS_PRIVATE_KEY
    );
}

// The subject and message are in the EmailJS template, which fills in to_email and reset_url
async function sendPasswordResetEmail(to, resetUrl) {
    const res = await fetch(EMAILJS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: { to_email: to, reset_url: resetUrl }
        })
    });

    if (!res.ok) throw new Error(`EmailJS replied with ${res.status}: ${await res.text()}`);
}

module.exports = { isEmailSetUp, sendPasswordResetEmail };
