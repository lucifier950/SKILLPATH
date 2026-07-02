import { useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

function PhoneRegister() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  // Created once, inside handleSendOtp, then reused. The ref survives
  // StrictMode's double-render so we never build a second reCAPTCHA.
  const verifierRef = useRef(null);

  const getVerifier = () => {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return verifierRef.current;
  };

  // Turn whatever the user typed into E.164 (+91XXXXXXXXXX).
  const toE164 = (raw) => {
    const digits = raw.replace(/\D/g, ""); // strip spaces, dashes, etc.
    if (raw.trim().startsWith("+")) return "+" + digits;
    return "+91" + digits; // default to India if no country code given
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const formatted = toE164(phone);
    if (formatted.replace(/\D/g, "").length < 11) {
      setMessage("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const result = await signInWithPhoneNumber(auth, formatted, getVerifier());
      setConfirmationResult(result);
      setMessage("OTP sent! Check your phone.");
    } catch (err) {
      setMessage(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      setMessage("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await confirmationResult.confirm(otp);
      setVerified(true);
    } catch (err) {
      setMessage("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="neu-card p-8 text-center">
        <p className="text-[var(--neu-accent)] text-lg font-semibold">
          Phone verified! Welcome to SkillPath.
        </p>
      </div>
    );
  }

  return (
    <div className="neu-card p-8">
      {!confirmationResult ? (
        <form onSubmit={handleSendOtp}>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="neu-input w-full p-3 mb-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="neu-btn-accent w-full font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="neu-input w-full p-3 mb-4 tracking-widest text-center"
          />
          <button
            type="submit"
            disabled={loading}
            className="neu-btn-accent w-full font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Register"}
          </button>
        </form>
      )}

      {message && (
        <p className="text-center text-[var(--neu-text-soft)] mt-4 text-sm">
          {message}
        </p>
      )}

      {/* Invisible reCAPTCHA mounts here */}
      <div id="recaptcha-container"></div>
    </div>
  );
}

export default PhoneRegister;
