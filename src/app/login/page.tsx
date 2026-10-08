import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function Login() {
  return <main id="main" className="auth-page"><section className="auth-panel">
    <p className="brand">SKINTIFIC <span>Visual Bank</span></p>
    <h1>A place for<br />the next idea.</h1>
    <p>Sign in with your team account to upload and manage visual references.</p>
    <LoginForm />
    <p className="fine-print">Need an account? Ask the project owner for access.</p>
    <Link href="/">Back to the gallery</Link>
  </section><aside className="auth-aside" aria-label="About the library"><p>Keep the references.<br />Find the connections.</p><span>Your team’s shared image library.</span></aside></main>;
}
