import { useState } from "react";

function ContactPage(){
    const[form , setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const handleChange = (e) => {
        setForm({...form,[e.target.name]: e.target.value});

    };
    const [submitted, setSubmitted] = useState(false);
    const handleSubmit = (e) =>{
        e.preventDefault();
        if(!form.name||!form.email||!form.subject|| !form.message){
            alert("Please fill all the fields");
            return;
        }
        setSubmitted(true);
    }
    return(
        <div className="max-w-xl mx-auto py-16 px-4">
            <h1 className="text-3xl font-bold mb-6 text-center">Contact us</h1>
           {submitted ?(
            <p className="text-green-600 text-center text-lg font-semibold">
              Thank you! Your message has been sent.  
            </p>
           ): (
            <form onSubmit={handleSubmit}>
                <input name="name" type="text" placeholder="Your Name"
                value={form.name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4"/>
                <input name="email"   type="email" placeholder="Your Email"
            value={form.email}   onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 mb-4" />
            <input name="subject" type="text"  placeholder="Subject"
            value={form.subject} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 mb-4" />
            <textarea name="message" placeholder="Your Message" rows="4"
  value={form.message} onChange={handleChange}
  className="w-full border border-gray-300 rounded-lg p-3 mb-4" />
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg">
                Send Message
            </button>
             </form>
           )}
        </div>
    );
}
export default ContactPage