"use client"

import { useState } from "react"
import { Alert, StyleSheet, View, KeyboardAvoidingView, Platform, Image } from "react-native"
import { Button, TextInput, Text, Card, HelperText } from "react-native-paper"
import { Link } from "expo-router"
import { supabase } from "../../lib/supabase"
import { z } from "zod"


const loginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória").min(6, "Senha deve ter pelo menos 6 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({ email: "", password: "" })

  const handleEmailChange = (text: string) => {
    setEmail(text)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }))
    }
  }

  const handlePasswordChange = (text: string) => {
    setPassword(text)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }))
    }
  }

  async function signInWithEmail() {
    setErrors({ email: "", password: "" })

 
    const formData: LoginFormData = {
      email: email.trim(),
      password: password,
    }

    const validation = loginSchema.safeParse(formData)

    if (!validation.success) {
      const newErrors = { email: "", password: "" }

      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof newErrors
        if (field in newErrors) {
          newErrors[field] = issue.message
        }
      })

      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email.toLowerCase(),
        password: validation.data.password,
      })

      if (error) {
        let errorMessage = "Erro no login"

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos"
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor, confirme seu email antes de fazer login"
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos"
        } else {
          errorMessage = error.message
        }

        Alert.alert("Erro no Login", errorMessage)
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={require("../../app/assets/ludoimg.png")} style={styles.logo} resizeMode="contain" />
              </View>
              <Text variant="headlineMedium" style={styles.title}>
                Bem-vindo ao Ludo List!
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Faça login para continuar sua jornada nos jogos de tabuleiro
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  label="Email"
                  left={<TextInput.Icon icon="email" />}
                  onChangeText={handleEmailChange}
                  value={email}
                  placeholder="seuemail@exemplo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  mode="outlined"
                  error={!!errors.email}
                  autoComplete="email"
                />
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email}
                </HelperText>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Senha"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  onChangeText={handlePasswordChange}
                  value={password}
                  secureTextEntry={!showPassword}
                  placeholder="Sua senha"
                  autoCapitalize="none"
                  mode="outlined"
                  error={!!errors.password}
                  autoComplete="password"
                />
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password}
                </HelperText>
              </View>

              <Button
                mode="contained"
                loading={loading}
                disabled={loading}
                onPress={signInWithEmail}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Link href="/(auth)/register" asChild>
            <Text style={styles.switchText}>
              Não tem uma conta? <Text style={styles.switchTextBold}>Cadastre-se</Text>
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 3,
  },
  logo: {
    width: 120,
    height: 120,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    lineHeight: 20,
  },
  form: {
    gap: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  switchText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
  },
  switchTextBold: {
    fontWeight: "bold",
    color: "#6200ee",
  },
})
