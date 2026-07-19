import { useState, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../firebase";

function PhoneRegister(){
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [verified, setVerified] = useState(false);
    const confirmationRef = useRef(null);   // holds the result from signInWithPhoneNumber
    const recaptchaRef = useRef(null);       // holds the reCAPTCHA verifier (create only once)

    const setupRecaptcha = () => {
        if (!recaptchaRef.current) {
            recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
        }
        return recaptchaRef.current;
    };

    const sendOtp = async () => {
        if (!phone) {
            alert("Please enter your phone number (with country code, e.g. +91...)");
            return;
        }
        try {
            const verifier = setupRecaptcha();
            const result = await signInWithPhoneNumber(auth, phone, verifier);
            confirmationRef.current = result;
            setOtpSent(true);
        } catch (err) {
            console.error(err);
            alert("Failed to send OTP: " + err.message);
        }
    };

    const verifyOtp = async () => {
        if (!otp) {
            alert("Please enter the OTP");
            return;
        }
        try {
            await confirmationRef.current.confirm(otp);
            setVerified(true);
        } catch (err) {
            console.error(err);
            alert("Invalid OTP, please try again");
        }
    };

    return (
        <div className="neu-card p-8 mt-6">
            <h2 className="text-xl font-bold mb-4 text-center text-[var(--neu-text)]">
                Register with Phone
            </h2>
            {verified ? (
                <p className="text-[var(--neu-accent)] text-center text-lg font-semibold">
                    Phone verified! You're registered.
                </p>
            ) : !otpSent ? (
                <>
                    <input type="tel" placeholder="+91 9999999999"
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="neu-input w-full p-3 mb-4" />
                    <button onClick={sendOtp} className="neu-btn-accent w-full font-semibold py-3">
                        Send OTP
                    </button>
                </>
            ) : (
                <>
                    <input type="text" placeholder="Enter 6-digit OTP"
                        value={otp} onChange={(e) => setOtp(e.target.value)}
                        className="neu-input w-full p-3 mb-4" />
                    <button onClick={verifyOtp} className="neu-btn-accent w-full font-semibold py-3">
                        Verify OTP
                    </button>
                </>
            )}
            <div id="recaptcha-container"></div>
        </div>
    );
}

export default PhoneRegister;
