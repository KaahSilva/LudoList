import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vagikzaskcxzjobwjugs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZ2lremFza2N4empvYndqdWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzU2ODUsImV4cCI6MjA2OTE1MTY4NX0.c8nhT-VoiWslHSWKrzF2jUwZyjT7kn2UhdJSYVfgUaM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})