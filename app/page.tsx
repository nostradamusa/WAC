"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabase"

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        console.error("Get user error:", error)
        return
      }

      setUserEmail(data.user?.email ?? null)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    })

    if (error) {
      console.error("Google sign-in error:", error)
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Sign out error:", error)
    } else {
      setUserEmail(null)
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>World Albanian Congress</h1>
      <p>Authentication test</p>

      {userEmail ? (
        <>
          <p>Signed in as: {userEmail}</p>
          <button
            onClick={signOut}
            style={{
              marginTop: 20,
              padding: "12px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          onClick={signInWithGoogle}
          style={{
            marginTop: 20,
            padding: "12px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Continue with Google
        </button>
      )}
    </div>
  )
}