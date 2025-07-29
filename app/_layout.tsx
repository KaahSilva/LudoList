"use client"

import { Stack, useRouter, useSegments } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { createContext, useContext, useEffect, useState } from "react"
import { PaperProvider } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import { supabase } from "../lib/supabase"


SplashScreen.preventAutoHideAsync()


interface Profile {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: "user" | "admin"
  created_at: string
}

interface AuthContextType {
  session: any | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
})


export function useAuth() {
  return useContext(AuthContext)
}

export default function RootLayout() {
  const [session, setSession] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  // Função para buscar o perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Erro ao buscar perfil:", error.message)
        return null
      }

      return data
    } catch (error) {
      console.error("Erro inesperado ao buscar perfil:", error)
      return null
    }
  }

  // Função para atualizar o perfil 
  const refreshProfile = async () => {
    if (session?.user?.id) {
      const profileData = await fetchProfile(session.user.id)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    // Busca a sessão inicial ao carregar o app
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Erro ao buscar sessão:", error.message)
        }

        setSession(session)

        // Se há sessão, busca o perfil
        if (session?.user?.id) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Escuta por mudanças na autenticação (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      setSession(session)

      if (session?.user?.id) {
        // Usuário fez login, busca o perfil
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else {
        // Usuário fez logout, limpa o perfil
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Lógica de navegação, só roda depois que o loading terminar
    if (loading) return

    const inAuthGroup = segments[0] === "(auth)"

    if (!session && !inAuthGroup) {
      // Usuário não logado e não está nas telas de auth
      router.replace("/(auth)")
    } else if (session && inAuthGroup) {
      // Usuário logado mas está nas telas de auth
      router.replace("/(drawer)/feed")
    }
  }, [session, loading, segments, router])

  useEffect(() => {
    // Esconde a splash screen quando o carregamento terminar
    if (!loading) {
      SplashScreen.hideAsync()
    }
  }, [loading])

  // Não mostra nada até sabermos o status do usuário
  if (loading) {
    return null
  }

  // Calcula se o usuário é admin
  const isAdmin = profile?.role === "admin"

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin,
        refreshProfile,
      }}
    >
      <PaperProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </PaperProvider>
    </AuthContext.Provider>
  )
}
