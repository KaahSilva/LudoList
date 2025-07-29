"use client"

import { useState } from "react"
import { Alert, StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Image } from "react-native"
import { Button, TextInput, Text, Card, HelperText } from "react-native-paper"
import { Link, useRouter } from "expo-router"
import { supabase } from "../../lib/supabase"
import { z } from "zod"


const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .transform((val) => val.trim()),
    lastName: z.string().transform((val) => val.trim()),
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Email inválido")
      .transform((val) => val.trim()),
    password: z.string().min(1, "Senha é obrigatória").min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({
    firstName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const router = useRouter()

  const generateUsername = (firstName: string, email: string) => {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, "")
    const emailPart = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
    const randomNum = Math.floor(Math.random() * 1000)

    return cleanFirstName ? `${cleanFirstName}${randomNum}` : `${emailPart}${randomNum}`
  }

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "firstName":
        setFirstName(value)
        break
      case "lastName":
        setLastName(value)
        break
      case "email":
        setEmail(value)
        break
      case "password":
        setPassword(value)
        break
      case "confirmPassword":
        setConfirmPassword(value)
        break
    }
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  async function signUpWithEmail() {
    setErrors({
      firstName: "",
      email: "",
      password: "",
      confirmPassword: "",
    })

    const formData: RegisterFormData = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      confirmPassword: confirmPassword,
    }

    const validation = registerSchema.safeParse(formData)

    if (!validation.success) {
      const newErrors = {
        firstName: "",
        email: "",
        password: "",
        confirmPassword: "",
      }

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
      const username = generateUsername(validation.data.firstName, validation.data.email)
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email.toLowerCase(),
        password: validation.data.password,
        options: {
          data: {
            first_name: validation.data.firstName,
            last_name: validation.data.lastName,
            username: username,
          },
        },
      })

      if (error) {
        let errorMessage = "Erro no cadastro"

        if (error.message.includes("User already registered")) {
          errorMessage = "Este email já está cadastrado"
        } else if (error.message.includes("Password should be at least 6 characters")) {
          errorMessage = "Senha deve ter pelo menos 6 caracteres"
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Email inválido"
        } else {
          errorMessage = error.message
        }

        Alert.alert("Erro no Cadastro", errorMessage)
      } else if (!data.session) {
        Alert.alert(
          "Cadastro realizado! ",
          "Enviamos um link de confirmação para o seu email. Por favor, verifique sua caixa de entrada e spam.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)"),
            },
          ],
        )
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.logoContainer}>
              <Image source={require("../../app/assets/ludoimg.png")} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.title}>
                Junte-se ao Ludo List!
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Crie sua conta e comece a organizar sua coleção de jogos
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  label="Nome *"
                  left={<TextInput.Icon icon="account" />}
                  onChangeText={(text) => handleFieldChange("firstName", text)}
                  value={firstName}
                  mode="outlined"
                  error={!!errors.firstName}
                  autoComplete="given-name"
                />
                <HelperText type="error" visible={!!errors.firstName}>
                  {errors.firstName}
                </HelperText>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Sobrenome"
                  left={<TextInput.Icon icon="account-outline" />}
                  onChangeText={(text) => handleFieldChange("lastName", text)}
                  value={lastName}
                  mode="outlined"
                  autoComplete="family-name"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Email *"
                  left={<TextInput.Icon icon="email" />}
                  onChangeText={(text) => handleFieldChange("email", text)}
                  value={email}
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
                  label="Senha *"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  onChangeText={(text) => handleFieldChange("password", text)}
                  value={password}
                  secureTextEntry={!showPassword}
                  mode="outlined"
                  error={!!errors.password}
                  autoComplete="new-password"
                />
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password}
                </HelperText>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Confirmar Senha *"
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                  onChangeText={(text) => handleFieldChange("confirmPassword", text)}
                  value={confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  mode="outlined"
                  error={!!errors.confirmPassword}
                  autoComplete="new-password"
                />
                <HelperText type="error" visible={!!errors.confirmPassword}>
                  {errors.confirmPassword}
                </HelperText>
              </View>

              <Button
                mode="contained"
                loading={loading}
                disabled={loading}
                onPress={signUpWithEmail}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Link href="/(auth)/" asChild>
            <Text style={styles.switchText}>
              Já tem uma conta? <Text style={styles.switchTextBold}>Faça login</Text>
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 3,
  },
  logo: {
    width: 100,
    height: 100,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  header: {
    marginBottom: 20,
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
  registerButton: {
    marginTop: 10,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    marginTop: 20,
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
