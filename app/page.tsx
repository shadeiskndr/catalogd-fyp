import Login from "@/components/landing/login"

// Authenticated users are redirected to /dashboard by the middleware,
// so this page only ever renders the login screen.
export default function Landing() {
  return (
    <main>
      <Login />
    </main>
  )
}
