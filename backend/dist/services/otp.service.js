"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = void 0;
const sendOTP = async (phone, otp) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(` [DEV] OTP for ${phone}: ${otp}`);
        return;
    }
    // Production: Implement Twilio
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromPhone = process.env.TWILIO_PHONE_NUMBER;
        if (!accountSid || !authToken || !fromPhone) {
            console.warn('  Twilio credentials not configured. OTP not sent via SMS.');
            console.log(` OTP for ${phone}: ${otp}`);
            return;
        }
        // install twilio package
        const client = require('twilio')(accountSid, authToken);
        await client.messages.create({
            body: `Your Nila Healthcare OTP is: ${otp}. Valid for 10 minutes.`,
            from: fromPhone,
            to: phone,
        });
        console.log(` OTP sent to ${phone}`);
    }
    catch (error) {
        console.error('SMS send error:', error);
        throw new Error('Failed to send OTP');
    }
};
exports.sendOTP = sendOTP;
//# sourceMappingURL=otp.service.js.map