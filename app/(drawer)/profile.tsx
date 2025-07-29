"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Card, Text, Avatar, Button, TextInput, HelperText } from "react-native-paper"
import { useAuth } from "../_layout"
import { supabase } from "../../lib/supabase"
import { z } from "zod"


const profileSchema = z.object({
  first_name: z
    .string()
    .min(1, "Nome é obrigatório")
    .transform((val) => val.trim()),
  last_name: z.string().transform((val) => val.trim()),
  username: z
    .string()
    .min(1, "Username é obrigatório")
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .transform((val) => val.trim()),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfileScreen() {
  const { profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    username: profile?.username || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const validation = profileSchema.safeParse(formData)

    if (!validation.success) {
      const newErrors: Record<string, string> = {}

      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        newErrors[field] = issue.message
      })

      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleSave = async () => {
    if (!validateForm() || !profile) return

    setLoading(true)
    try {
      const validatedData = profileSchema.parse(formData)

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          username: validatedData.username,
        })
        .eq("id", profile.id)

      if (error) {
        console.error("Erro ao atualizar perfil:", error)
        return
      }

      await refreshProfile()
      setEditing(false)
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      username: profile?.username || "",
    })
    setErrors({})
    setEditing(false)
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Carregando perfil...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text size={80} label={profile.first_name?.charAt(0) || "U"} style={styles.avatar} />

          {!editing ? (
            <View style={styles.info}>
              <Text variant="headlineSmall" style={styles.name}>
                {profile.first_name} {profile.last_name}
              </Text>
              <Text variant="bodyLarge" style={styles.username}>
                @{profile.username}
              </Text>
              <Text variant="bodyMedium" style={styles.role}>
                {profile.role === "admin" ? "Administrador" : "Usuário"}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                Membro desde {new Date(profile.created_at).toLocaleDateString("pt-BR")}
              </Text>
              <Button mode="contained" onPress={() => setEditing(true)} style={styles.editButton}>
                Editar Perfil
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  label="Nome *"
                  value={formData.first_name}
                  onChangeText={(text) => updateField("first_name", text)}
                  mode="outlined"
                  error={!!errors.first_name}
                />
                <HelperText type="error" visible={!!errors.first_name}>
                  {errors.first_name}
                </HelperText>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Sobrenome"
                  value={formData.last_name}
                  onChangeText={(text) => updateField("last_name", text)}
                  mode="outlined"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Username *"
                  value={formData.username}
                  onChangeText={(text) => updateField("username", text)}
                  mode="outlined"
                  error={!!errors.username}
                />
                <HelperText type="error" visible={!!errors.username}>
                  {errors.username}
                </HelperText>
              </View>

              <View style={styles.buttonContainer}>
                <Button mode="outlined" onPress={handleCancel} style={styles.button}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Salvar
                </Button>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  cardContent: {
    alignItems: "center",
    padding: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  info: {
    alignItems: "center",
    width: "100%",
  },
  name: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  username: {
    opacity: 0.7,
    marginBottom: 8,
  },
  role: {
    marginBottom: 8,
    fontWeight: "500",
  },
  date: {
    opacity: 0.6,
    marginBottom: 24,
  },
  editButton: {
    width: "100%",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
})
